const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = 5003;  // Hardcoded port for debugging

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio-monitor', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Portfolio Schema
const portfolioSchema = new mongoose.Schema({
  name: String,
  description: String,
  assets: [{
    symbol: String,
    name: String,
    quantity: Number,
    purchasePrice: Number,
    currentPrice: Number,
    purchaseDate: Date
  }],
  createdAt: { type: Date, default: Date.now }
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

// Routes
// Get all portfolios
app.get('/api/portfolios', async (req, res) => {
  console.log('Received GET request to /api/portfolios');
  console.log('Request headers:', req.headers);
  
  try {
    const portfolios = await Portfolio.find();
    console.log('Found portfolios:', portfolios);
    res.json(portfolios);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({ 
      message: 'Error fetching portfolios',
      error: error.message 
    });
  }
});

// Create new portfolio
app.post('/api/portfolios', async (req, res) => {
  const portfolio = new Portfolio({
    name: req.body.name,
    description: req.body.description,
    assets: []
  });

  try {
    const newPortfolio = await portfolio.save();
    res.status(201).json(newPortfolio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get single portfolio
app.get('/api/portfolios/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add asset to portfolio
app.post('/api/portfolios/:id/assets', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const newAsset = {
      symbol: req.body.symbol,
      name: req.body.name,
      quantity: req.body.quantity,
      purchasePrice: req.body.purchasePrice,
      currentPrice: req.body.currentPrice,
      purchaseDate: req.body.purchaseDate
    };

    portfolio.assets.push(newAsset);
    const updatedPortfolio = await portfolio.save();
    res.json(updatedPortfolio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove asset from portfolio
app.delete('/api/portfolios/:id/assets/:assetId', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    portfolio.assets = portfolio.assets.filter(asset => asset._id.toString() !== req.params.assetId);
    const updatedPortfolio = await portfolio.save();
    res.json(updatedPortfolio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update asset in portfolio
app.put('/api/portfolios/:id/assets/:assetId', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const assetIndex = portfolio.assets.findIndex(asset => asset._id.toString() === req.params.assetId);
    if (assetIndex === -1) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    portfolio.assets[assetIndex] = {
      ...portfolio.assets[assetIndex].toObject(),
      ...req.body
    };

    const updatedPortfolio = await portfolio.save();
    res.json(updatedPortfolio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete portfolio
app.delete('/api/portfolios/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findByIdAndDelete(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    res.json({ message: 'Portfolio deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 