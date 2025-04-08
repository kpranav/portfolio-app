import axios from 'axios';

const API_URL = 'http://localhost:5003/api';
const PYTHON_API_URL = 'http://localhost:5002/api';

// Portfolio API
export const getPortfolios = () => axios.get(`${API_URL}/portfolios`);
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
export const analyzePortfolio = (portfolio) => 
  axios.post(`${PYTHON_API_URL}/portfolio/analysis`, { portfolio }); 