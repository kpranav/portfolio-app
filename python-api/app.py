from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import time
from functools import wraps
import requests

load_dotenv()

app = Flask(__name__)
CORS(app)

def retry_on_error(max_retries=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if "429" in str(e) and attempt < max_retries - 1:
                        print(f"Rate limit hit, retrying in {delay} seconds... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(delay)
                    else:
                        raise e
            return func(*args, **kwargs)
        return wrapper
    return decorator

@retry_on_error(max_retries=3, delay=2)
def get_asset_data(symbol, period='1y'):
    try:
        print(f"Fetching data for symbol: {symbol}")
        
        # Get current price using a simple quote request
        quote_url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(quote_url, headers=headers)
        data = response.json()
        
        if 'chart' not in data or 'result' not in data['chart'] or not data['chart']['result']:
            error_message = f"Invalid ticker symbol: {symbol}. Please check the symbol and try again."
            print(error_message)
            return {
                'error': error_message,
                'current_price': 0,
                'historical_data': {},
                'name': symbol,
                'is_valid': False
            }
            
        quote_data = data['chart']['result'][0]
        current_price = quote_data['meta'].get('regularMarketPrice', 0)
        company_name = quote_data['meta'].get('symbol', symbol)
        
        # Get historical data
        end = int(datetime.now().timestamp())
        start = int((datetime.now() - timedelta(days=365)).timestamp())
        hist_url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?period1={start}&period2={end}&interval=1d"
        
        hist_response = requests.get(hist_url, headers=headers)
        hist_data = hist_response.json()
        
        historical_data = {}
        if 'chart' in hist_data and 'result' in hist_data['chart'] and hist_data['chart']['result']:
            timestamps = hist_data['chart']['result'][0]['timestamp']
            prices = hist_data['chart']['result'][0]['indicators']['quote'][0]['close']
            historical_data = {datetime.fromtimestamp(ts).strftime('%Y-%m-%d'): price 
                             for ts, price in zip(timestamps, prices) if price is not None}
        
        print(f"Successfully fetched data for {symbol}. Current price: {current_price}")
        
        return {
            'current_price': current_price,
            'historical_data': historical_data,
            'name': company_name,
            'is_valid': True
        }
    except requests.exceptions.RequestException as e:
        error_message = f"Network error while fetching data for {symbol}. Please try again later."
        print(error_message)
        return {
            'error': error_message,
            'current_price': 0,
            'historical_data': {},
            'name': symbol,
            'is_valid': False
        }
    except Exception as e:
        error_message = f"Error fetching data for {symbol}: {str(e)}"
        print(error_message)
        return {
            'error': error_message,
            'current_price': 0,
            'historical_data': {},
            'name': symbol,
            'is_valid': False
        }

@app.route('/api/asset/<symbol>', methods=['GET'])
def get_asset_info(symbol):
    data = get_asset_data(symbol)
    return jsonify(data)

@app.route('/api/portfolio/analysis', methods=['POST'])
def analyze_portfolio():
    try:
        data = request.json
        portfolio = data.get('portfolio', [])
        print(f"Received portfolio data: {portfolio}")
        
        total_value = 0
        asset_distribution = []
        historical_data = {}
        
        for asset in portfolio:
            symbol = asset.get('symbol', '')
            quantity = float(asset.get('quantity', 0))
            current_price = float(asset.get('currentPrice', 0))
            purchase_price = float(asset.get('purchasePrice', 0))
            
            print(f"Processing asset: {symbol}, quantity: {quantity}, current_price: {current_price}")
            
            asset_value = quantity * current_price
            total_value += asset_value
            
            # Get historical data
            stock_data = get_asset_data(symbol)
            if stock_data.get('is_valid', False):
                historical_data[symbol] = stock_data.get('historical_data', {})
            
            if total_value > 0:
                percentage = (asset_value / total_value) * 100
            else:
                percentage = 0
                
            asset_distribution.append({
                'symbol': symbol,
                'value': asset_value,
                'percentage': percentage
            })
        
        print(f"Calculated total value: {total_value}")
        
        # Calculate expected cashflows based on NPV
        expected_inbound = total_value * 0.04
        expected_outbound = total_value * 0.02
        
        print(f"Expected inbound: {expected_inbound}")
        print(f"Expected outbound: {expected_outbound}")
        
        # Calculate portfolio performance
        performance_data = calculate_performance(historical_data, portfolio)
        
        return jsonify({
            'total_value': total_value,
            'asset_distribution': asset_distribution,
            'performance': performance_data,
            'npv': total_value,
            'expected_inbound': expected_inbound,
            'expected_outbound': expected_outbound,
            'available_cash': max(0, expected_inbound - expected_outbound)  # Available cash is the net of inbound and outbound
        })
    except Exception as e:
        print(f"Error in analyze_portfolio: {str(e)}")
        return jsonify({'error': str(e)}), 500

def calculate_performance(historical_data, portfolio):
    if not historical_data:
        return {}
    
    # Create a DataFrame with all historical prices
    df = pd.DataFrame(historical_data)
    
    # Calculate daily returns
    returns = df.pct_change()
    
    # Calculate portfolio weights
    weights = np.array([asset['quantity'] * asset['currentPrice'] for asset in portfolio])
    weights = weights / weights.sum()
    
    # Calculate portfolio returns
    portfolio_returns = (returns * weights).sum(axis=1)
    
    # Calculate metrics
    total_return = (1 + portfolio_returns).prod() - 1
    annualized_return = (1 + total_return) ** (252 / len(portfolio_returns)) - 1
    volatility = portfolio_returns.std() * np.sqrt(252)
    
    return {
        'total_return': total_return,
        'annualized_return': annualized_return,
        'volatility': volatility,
        'daily_returns': portfolio_returns.to_dict()
    }

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5002))
    app.run(host='0.0.0.0', port=port) 