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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { createPortfolio, getPortfolios } from '../services/api';

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
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          My Portfolios
        </Typography>
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