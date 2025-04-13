import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

const calculateMetrics = (portfolio) => {
  console.log('Raw portfolio data:', portfolio);
  
  // Use the analysis data from the backend if available
  if (portfolio.analysis) {
    const metrics = {
      npv: portfolio.analysis.npv || 0,
      expectedInbound: portfolio.analysis.expected_inbound || 0,
      expectedOutbound: portfolio.analysis.expected_outbound || 0,
      availableCash: portfolio.analysis.available_cash || 0
    };
    console.log('Analysis metrics:', metrics);
    return metrics;
  }

  // Fallback to calculating from assets if no analysis data
  if (portfolio.assets && portfolio.assets.length > 0) {
    const totalValue = portfolio.assets.reduce((sum, asset) => {
      const quantity = parseFloat(asset.quantity) || 0;
      const currentPrice = parseFloat(asset.currentPrice) || 0;
      const value = quantity * currentPrice;
      return sum + value;
    }, 0);

    return {
      npv: totalValue,
      expectedInbound: 0,
      expectedOutbound: 0,
      availableCash: 0
    };
  }

  return {
    npv: 0,
    expectedInbound: 0,
    expectedOutbound: 0,
    availableCash: 0
  };
};

const PortfolioMetricsGrid = ({ portfolios }) => {
  if (!portfolios || portfolios.length === 0) {
    return <Typography>No portfolios available</Typography>;
  }

  return (
    <Grid container spacing={3}>
      {portfolios.map((portfolio) => {
        const metrics = calculateMetrics(portfolio);
        
        return (
          <Grid item xs={12} key={portfolio._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {portfolio.name}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Net Present Value
                    </Typography>
                    <Typography variant="h6">
                      ${metrics.npv.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Expected Inbound Cashflow
                    </Typography>
                    <Typography variant="h6">
                      ${metrics.expectedInbound.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Expected Outbound Cashflow
                    </Typography>
                    <Typography variant="h6">
                      ${metrics.expectedOutbound.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Available Unutilized Cash
                    </Typography>
                    <Typography variant="h6">
                      ${metrics.availableCash.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default PortfolioMetricsGrid; 