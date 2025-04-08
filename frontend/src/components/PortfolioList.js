import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Container,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { createPortfolio, getPortfolios } from '../services/api';

const calculateMetrics = (portfolio) => {
  // Hardcode NPV values based on portfolio name or ID
  const npvValues = {
    'Portfolio 1': 100000000,  // 100M
    'Portfolio 2': 120000000,  // 120M
    'Portfolio 3': 140000000   // 140M
  };

  return {
    npv: npvValues[portfolio.name] || 0,
    expectedInbound: 0,
    expectedOutbound: 0,
    availableCash: 0
  };
};

const PortfolioList = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [open, setOpen] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const response = await getPortfolios();
      setPortfolios(response.data);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    }
  };

  const handleCreatePortfolio = async () => {
    try {
      await createPortfolio(newPortfolio);
      setOpen(false);
      setNewPortfolio({ name: '', description: '' });
      fetchPortfolios();
    } catch (error) {
      console.error('Error creating portfolio:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            My Portfolios
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 2, px: 3 }}
        >
          New Portfolio
        </Button>
      </Box>

      <Grid container spacing={3}>
        {portfolios.map((portfolio) => (
          <Grid item xs={12} sm={6} md={4} key={portfolio._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                  {portfolio.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {portfolio.description || 'No description available'}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {portfolio.assets?.length || 0} assets
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/portfolio/${portfolio._id}`)}
                    sx={{ borderRadius: 2 }}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Financial Metrics Table */}
      <Card sx={{ mb: 4, mt: 6, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
            Portfolio Financial Metrics
          </Typography>
          <TableContainer component={Paper} sx={{ 
            bgcolor: 'background.paper',
            '& .MuiTableCell-root': {
              color: 'text.primary',
              borderColor: 'divider'
            }
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Portfolio Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Net Present Value</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Expected Inbound Cashflow</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Expected Outbound Cashflow</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Available Unutilized Cash</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolios.map((portfolio) => {
                  const metrics = calculateMetrics(portfolio);
                  return (
                    <TableRow 
                      key={portfolio._id}
                      hover
                      onClick={() => navigate(`/portfolio/${portfolio._id}`)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <TableCell>{portfolio.name}</TableCell>
                      <TableCell align="right">
                        ${metrics.npv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        ${metrics.expectedInbound.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        ${metrics.expectedOutbound.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        ${metrics.availableCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Portfolio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Portfolio Name"
            type="text"
            fullWidth
            value={newPortfolio.name}
            onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={newPortfolio.description}
            onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleCreatePortfolio} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PortfolioList; 