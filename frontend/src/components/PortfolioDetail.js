import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  Snackbar,
  Container,
  useTheme,
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule, ValidationModule } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
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
import EditIcon from '@mui/icons-material/Edit';
import { 
  getPortfolio, 
  addAsset, 
  deleteAsset,
  getAssetInfo,
  analyzePortfolio,
  updatePortfolio
} from '../services/api';

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

const PortfolioDetail = () => {
  const { id: portfolioId } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [assets, setAssets] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [newAsset, setNewAsset] = useState({
    symbol: '',
    quantity: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });
  const theme = useTheme();

  useEffect(() => {
    setGridData(assets);
  }, [assets]);

  const calculateTotalValue = (assets) => {
    if (!assets || assets.length === 0) return 0;
    return assets.reduce((total, asset) => {
      const quantity = parseFloat(asset.quantity) || 0;
      const currentPrice = parseFloat(asset.currentPrice) || 0;
      return total + (quantity * currentPrice);
    }, 0);
  };

  const calculateTotalReturn = (assets) => {
    if (!assets || assets.length === 0) return 0;
    const totalReturn = assets.reduce((total, asset) => {
      const quantity = parseFloat(asset.quantity) || 0;
      const currentPrice = parseFloat(asset.currentPrice) || 0;
      const purchasePrice = parseFloat(asset.purchasePrice) || 0;
      if (purchasePrice === 0) return total;
      const returnPercentage = ((currentPrice - purchasePrice) / purchasePrice) * 100;
      return total + (returnPercentage * (quantity * purchasePrice));
    }, 0);
    
    const totalInvestment = assets.reduce((total, asset) => {
      const quantity = parseFloat(asset.quantity) || 0;
      const purchasePrice = parseFloat(asset.purchasePrice) || 0;
      return total + (quantity * purchasePrice);
    }, 0);

    return totalInvestment > 0 ? totalReturn / totalInvestment : 0;
  };

  const calculateAssetDistribution = (assets) => {
    if (!assets || assets.length === 0) return [];
    const totalValue = calculateTotalValue(assets);
    if (totalValue === 0) return [];

    return assets.map(asset => {
      const quantity = parseFloat(asset.quantity) || 0;
      const currentPrice = parseFloat(asset.currentPrice) || 0;
      const value = quantity * currentPrice;
      return {
        symbol: asset.symbol,
        percentage: (value / totalValue) * 100
      };
    });
  };

  const fetchPortfolio = async () => {
    try {
      setError(null);
      const response = await getPortfolio(portfolioId);
      setPortfolio(response.data);
      setAssets(response.data.assets || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setError(error.response?.data?.error || 'Failed to fetch portfolio');
    }
  };

  const analyzePortfolioData = async () => {
    try {
      setError(null);
      const response = await analyzePortfolio(assets);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      setError(error.response?.data?.error || 'Failed to analyze portfolio');
    }
  };

  const handleEditName = async () => {
    try {
      setError(null);
      await updatePortfolio(portfolioId, { name: newName });
      setEditNameOpen(false);
      fetchPortfolio();
    } catch (error) {
      console.error('Error updating portfolio name:', error);
      setError(error.response?.data?.error || 'Failed to update portfolio name');
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [portfolioId]);

  useEffect(() => {
    if (assets?.length > 0) {
      analyzePortfolioData();
    }
  }, [assets]);

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
      await deleteAsset(portfolioId, assetId);
      if (gridApi) {
        const rowNode = gridApi.getRowNode(assetId);
        if (rowNode) {
          gridApi.applyTransaction({ remove: [rowNode.data] });
        }
      }
      setAssets(prevAssets => prevAssets.filter(asset => asset._id !== assetId));
    } catch (error) {
      console.error('Error deleting asset:', error);
      setError('Failed to delete asset');
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const DeleteButtonRenderer = (props) => {
    const handleClick = () => {
      handleDeleteAsset(props.data._id);
    };
    return (
      <IconButton 
        size="small" 
        onClick={handleClick}
        color="error"
      >
        <DeleteIcon />
      </IconButton>
    );
  };

  const columnDefs = useMemo(() => [
    {
      headerName: 'Symbol',
      field: 'symbol',
      width: 120,
      headerClass: 'ag-header-cell-center',
      cellClass: 'ag-cell-left'
    },
    {
      headerName: 'Name',
      field: 'name',
      width: 200,
      headerClass: 'ag-header-cell-center',
      cellClass: 'ag-cell-left'
    },
    {
      headerName: 'Quantity',
      field: 'quantity',
      type: 'numericColumn',
      width: 120,
      headerClass: 'ag-header-cell-center',
      cellClass: 'ag-cell-left'
    },
    {
      headerName: 'Purchase Price',
      field: 'purchasePrice',
      type: 'numericColumn',
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
      width: 150,
      headerClass: 'ag-header-cell-center',
      cellClass: 'ag-cell-left'
    },
    {
      headerName: 'Current Price',
      field: 'currentPrice',
      type: 'numericColumn',
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
      width: 150,
      headerClass: 'ag-header-cell-center',
      cellClass: 'ag-cell-left'
    },
    {
      headerName: 'Value',
      field: 'value',
      type: 'numericColumn',
      valueGetter: (params) => {
        const quantity = params.data.quantity || 0;
        const currentPrice = params.data.currentPrice || 0;
        return quantity * currentPrice;
      },
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
      width: 150,
      headerClass: 'ag-header-cell-center',
      cellClass: 'ag-cell-left'
    },
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: DeleteButtonRenderer,
      width: 100,
      headerClass: 'ag-header-cell-center',
      cellClass: 'ag-cell-center'
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  const frameworkComponents = useMemo(() => ({
    deleteButtonRenderer: DeleteButtonRenderer
  }), []);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              {portfolio?.name}
            </Typography>
            <IconButton 
              onClick={() => {
                setNewName(portfolio?.name || '');
                setEditNameOpen(true);
              }}
              sx={{ color: 'text.secondary' }}
            >
              <EditIcon />
            </IconButton>
          </Box>
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
              <div 
                className="ag-theme-alpine" 
                style={{ 
                  height: 400, 
                  width: '100%',
                  '--ag-background-color': theme.palette.background.paper,
                  '--ag-header-background-color': theme.palette.background.paper,
                  '--ag-odd-row-background-color': theme.palette.background.paper,
                  '--ag-row-hover-color': theme.palette.action.hover,
                  '--ag-header-foreground-color': theme.palette.text.primary,
                  '--ag-foreground-color': theme.palette.text.primary,
                  '--ag-border-color': theme.palette.divider,
                  '--ag-row-border-color': theme.palette.divider,
                  '--ag-header-column-separator-color': theme.palette.divider,
                  '--ag-header-column-resize-handle-color': theme.palette.divider,
                  '--ag-selected-row-background-color': theme.palette.action.selected,
                }}
              >
                <AgGridReact
                  modules={[ClientSideRowModelModule, ValidationModule]}
                  columnDefs={columnDefs}
                  rowData={gridData}
                  defaultColDef={defaultColDef}
                  frameworkComponents={frameworkComponents}
                  pagination={true}
                  paginationPageSize={10}
                  getRowId={params => params.data._id}
                  onGridReady={params => {
                    setGridApi(params.api);
                    params.api.autoSizeAllColumns();
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Portfolio Analysis
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Value
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ${(analysis?.total_value || calculateTotalValue(assets) || 0).toFixed(2)}
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
                    color: (analysis?.total_return || calculateTotalReturn(assets) || 0) >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  {(analysis?.total_return || calculateTotalReturn(assets) || 0) >= 0 ? '+' : ''}
                  {(analysis?.total_return || calculateTotalReturn(assets) || 0).toFixed(2)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Asset Distribution
                </Typography>
                {assets?.length > 0 ? (
                  calculateAssetDistribution(assets).map((asset) => (
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
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No assets in portfolio
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={editNameOpen} onClose={() => setEditNameOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Portfolio Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Portfolio Name"
            type="text"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNameOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleEditName} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

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