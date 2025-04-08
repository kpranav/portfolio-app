import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  Container,
  Divider,
  Chip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { 
  getPortfolio, 
  addAsset, 
  deleteAsset,
  getAssetInfo,
  analyzePortfolio
} from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PortfolioDetail = () => {
  const { id: portfolioId } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [newAsset, setNewAsset] = useState({
    symbol: '',
    quantity: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const fetchPortfolio = async () => {
    try {
      setError(null);
      const response = await getPortfolio(portfolioId);
      setPortfolio(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setError(error.response?.data?.error || 'Failed to fetch portfolio');
    }
  };

  const analyzePortfolioData = async () => {
    try {
      setError(null);
      const response = await analyzePortfolio(portfolio.assets);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      setError(error.response?.data?.error || 'Failed to analyze portfolio');
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [portfolioId]);

  useEffect(() => {
    if (portfolio?.assets?.length > 0) {
      analyzePortfolioData();
    }
  }, [portfolio?.assets]);

  const handleAddAsset = async () => {
    try {
      setError(null);
      const assetInfo = await getAssetInfo(newAsset.symbol);
      if (assetInfo.data.error) {
        throw new Error(assetInfo.data.error);
      }

      const asset = {
        ...newAsset,
        name: assetInfo.data.name,
        currentPrice: assetInfo.data.current_price
      };

      await addAsset(portfolioId, asset);
      setOpen(false);
      setNewAsset({
        symbol: '',
        quantity: '',
        purchasePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0]
      });
      fetchPortfolio();
    } catch (error) {
      console.error('Error adding asset:', error);
      setError(error.response?.data?.error || error.message || 'Failed to add asset');
    }
  };

  const handleDeleteAsset = async (assetId) => {
    try {
      setError(null);
      await deleteAsset(portfolioId, assetId);
      fetchPortfolio();
    } catch (error) {
      console.error('Error deleting asset:', error);
      setError(error.response?.data?.error || 'Failed to delete asset');
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  if (!portfolio) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/')} sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            {portfolio.name}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Add Asset
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Assets
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Purchase Price</TableCell>
                      <TableCell align="right">Current Price</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {portfolio?.assets?.map((asset) => (
                      <TableRow key={asset._id}>
                        <TableCell>
                          <Chip
                            label={asset.symbol}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>{asset.name || 'N/A'}</TableCell>
                        <TableCell align="right">{asset.quantity || 0}</TableCell>
                        <TableCell align="right">
                          ${(asset.purchasePrice || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          ${(asset.currentPrice || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          ${((asset.quantity || 0) * (asset.currentPrice || 0)).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={() => handleDeleteAsset(asset._id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Portfolio Analysis
              </Typography>
              {analysis ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Value
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      ${(analysis.total_value || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Return
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 600,
                        color: (analysis.total_return || 0) >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {(analysis.total_return || 0) >= 0 ? '+' : ''}
                      {(analysis.total_return || 0).toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Asset Distribution
                    </Typography>
                    {analysis.asset_distribution?.map((asset) => (
                      <Box
                        key={asset.symbol}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">{asset.symbol || 'N/A'}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {(asset.percentage || 0).toFixed(1)}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">
                  No analysis available. Add assets to see portfolio analysis.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Asset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Symbol"
            type="text"
            fullWidth
            value={newAsset.symbol}
            onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            value={newAsset.quantity}
            onChange={(e) => setNewAsset({ ...newAsset, quantity: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Purchase Price"
            type="number"
            fullWidth
            value={newAsset.purchasePrice}
            onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Purchase Date"
            type="date"
            fullWidth
            value={newAsset.purchaseDate}
            onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleAddAsset} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PortfolioDetail; 