import axios from 'axios';

const API_URL = 'http://localhost:5003/api';
const PYTHON_API_URL = 'http://localhost:5002/api';

// Portfolio API
export const getPortfolios = async () => {
  try {
    const response = await axios.get(`${API_URL}/portfolios`);
    console.log('Raw portfolios response:', response.data);
    
    // Get analysis for each portfolio
    const portfoliosWithAnalysis = await Promise.all(
      response.data.map(async (portfolio) => {
        try {
          console.log('Portfolio before analysis:', {
            id: portfolio._id,
            name: portfolio.name,
            assets: portfolio.assets,
            assetsCount: portfolio.assets?.length
          });

          const analysisResponse = await analyzePortfolio(portfolio.assets || []);
          console.log('Analysis response:', {
            portfolioId: portfolio._id,
            analysis: analysisResponse.data
          });

          return {
            ...portfolio,
            analysis: analysisResponse.data
          };
        } catch (error) {
          console.error(`Error analyzing portfolio ${portfolio._id}:`, error);
          return portfolio;
        }
      })
    );

    console.log('Final portfolios with analysis:', portfoliosWithAnalysis);
    return { data: portfoliosWithAnalysis };
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    throw error;
  }
};

export const createPortfolio = (portfolio) => axios.post(`${API_URL}/portfolios`, portfolio);
export const getPortfolio = (id) => axios.get(`${API_URL}/portfolios/${id}`);
export const deletePortfolio = (id) => axios.delete(`${API_URL}/portfolios/${id}`);

// Asset API
export const addAsset = (portfolioId, asset) => 
  axios.post(`${API_URL}/portfolios/${portfolioId}/assets`, asset);
export const updateAsset = (portfolioId, assetId, asset) => 
  axios.put(`${API_URL}/portfolios/${portfolioId}/assets/${assetId}`, asset);
export const deleteAsset = (portfolioId, assetId) => 
  axios.delete(`${API_URL}/portfolios/${portfolioId}/assets/${assetId}`);

// Analysis API
export const getAssetInfo = (symbol) => 
  axios.get(`${PYTHON_API_URL}/asset/${symbol}`);
export const analyzePortfolio = (assets) => {
  console.log('Sending assets for analysis:', assets);
  // Transform assets to match backend's expected structure
  const portfolioData = {
    portfolio: assets.map(asset => ({
      symbol: asset.symbol,
      quantity: parseFloat(asset.quantity) || 0,
      currentPrice: parseFloat(asset.currentPrice) || 0,
      purchasePrice: parseFloat(asset.purchasePrice) || 0
    }))
  };
  console.log('Transformed portfolio data:', portfolioData);
  return axios.post(`${PYTHON_API_URL}/portfolio/analysis`, portfolioData);
}; 