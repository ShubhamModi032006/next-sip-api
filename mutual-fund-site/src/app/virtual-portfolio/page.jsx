'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import axios from 'axios';
import dayjs from 'dayjs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

// ** KEY CHANGE **
// In a real app, this would come from your authentication system (like a user context).
// For now, we use the username of the dummy user we created in the seed script.
const DUMMY_USERNAME = 'testuser123';

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState([]);
  const [funds, setFunds] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);
  const [formData, setFormData] = useState({
    schemeCode: '',
    schemeName: '',
    units: '',
    avgPrice: '',
    investmentDate: dayjs()
  });
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFunds();
    loadPortfolio();
  }, []);

  const calculatePortfolioSummary = useCallback(async () => {
    setLoading(true);
    try {
      const summaryPromises = portfolio.map(async (holding) => {
        try {
          const response = await axios.get(`/api/scheme/${holding.schemeCode}`);
          const latestNav = response.data.summary?.latestNav;

          if (!latestNav || !latestNav.nav) {
            throw new Error(`Latest NAV not available for ${holding.schemeCode}`);
          }

          const currentValue = holding.units * parseFloat(latestNav.nav);
          const investedValue = holding.units * holding.avgPrice;
          const gainLoss = currentValue - investedValue;
          const gainLossPercentage = investedValue !== 0 ? (gainLoss / investedValue) * 100 : 0;

          return { ...holding, currentNav: parseFloat(latestNav.nav), currentValue, investedValue, gainLoss, gainLossPercentage };
        } catch (error) {
          console.error(`Error fetching NAV for ${holding.schemeCode}:`, error);
          const investedValue = holding.units * holding.avgPrice;
          return { ...holding, error: true, investedValue, currentValue: investedValue, gainLoss: 0, gainLossPercentage: 0 };
        }
      });

      const updatedHoldings = await Promise.all(summaryPromises);
      const totalInvested = updatedHoldings.reduce((sum, h) => sum + (h.investedValue || 0), 0);
      const totalCurrent = updatedHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
      const totalGainLoss = totalCurrent - totalInvested;
      const totalGainLossPercentage = totalInvested !== 0 ? (totalGainLoss / totalInvested) * 100 : 0;

      setPortfolioSummary({ holdings: updatedHoldings, totalInvested, totalCurrent, totalGainLoss, totalGainLossPercentage });
    } catch (error) {
      console.error('Error calculating portfolio summary:', error);
      setError('Could not update portfolio values.');
    } finally {
      setLoading(false);
    }
  }, [portfolio]);

  useEffect(() => {
    if (portfolio.length > 0) {
      calculatePortfolioSummary();
    } else {
      setPortfolioSummary(null);
    }
  }, [portfolio, calculatePortfolioSummary]);

  const fetchFunds = useCallback(async () => {
    try {
      const response = await axios.get('/api/mf');
      setFunds(response.data);
    } catch (error) {
      console.error('Error fetching funds:', error);
      setError('Could not load the list of mutual funds.');
    }
  }, []);

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/virtual-portfolio?username=${DUMMY_USERNAME}`);
      setPortfolio(response.data);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      setError('Failed to load your portfolio. Please try again later.');
      setPortfolio([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddHolding = () => {
    setEditingHolding(null);
    setFormData({ schemeCode: '', schemeName: '', units: '', avgPrice: '', investmentDate: dayjs() });
    setOpenDialog(true);
  };

  const handleEditHolding = (holding) => {
    setEditingHolding(holding);
    setFormData({ ...holding, investmentDate: dayjs(holding.investmentDate) });
    setOpenDialog(true);
  };

  const handleSaveHolding = async () => {
    const holdingData = { ...formData, investmentDate: formData.investmentDate.toISOString() };

    try {
      if (editingHolding) {
        await axios.put(`/api/virtual-portfolio?id=${editingHolding._id}`, holdingData);
      } else {
        // ** KEY CHANGE **
        // We now send the username when creating a new holding.
        await axios.post('/api/virtual-portfolio', { ...holdingData, username: DUMMY_USERNAME });
      }
      setOpenDialog(false);
      loadPortfolio();
    } catch (error) {
      console.error('Error saving holding:', error);
      setError('Could not save the holding.');
    }
  };

  const handleDeleteHolding = async (id) => {
    if (window.confirm('Are you sure you want to delete this holding?')) {
      try {
        await axios.delete(`/api/virtual-portfolio?id=${id}`);
        loadPortfolio();
      } catch (error) {
        console.error('Error deleting holding:', error);
        setError('Could not delete the holding.');
      }
    }
  };

  const handleFundSelect = (event, value) => {
    setFormData(prev => ({ ...prev, schemeCode: value?.schemeCode || '', schemeName: value?.schemeName || '' }));
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  const getPieChartData = () => portfolioSummary ? portfolioSummary.holdings.map(h => ({ name: h.schemeName, value: h.currentValue })) : [];
  const getPerformanceData = () => portfolioSummary ? portfolioSummary.holdings.map(h => ({ name: h.schemeName.substring(0, 15) + '...', invested: h.investedValue, current: h.currentValue })) : [];

  if (loading && !portfolio.length) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>My Virtual Portfolio</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {portfolioSummary && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}><Card><CardContent><Typography color="textSecondary" variant="body2">Total Invested</Typography><Typography variant="h6">{formatCurrency(portfolioSummary.totalInvested)}</Typography></CardContent></Card></Grid>
            <Grid item xs={6} md={3}><Card><CardContent><Typography color="textSecondary" variant="body2">Current Value</Typography><Typography variant="h6" color="primary">{formatCurrency(portfolioSummary.totalCurrent)}</Typography></CardContent></Card></Grid>
            <Grid item xs={6} md={3}><Card><CardContent><Typography color="textSecondary" variant="body2">Total Gain/Loss</Typography><Typography variant="h6" color={portfolioSummary.totalGainLoss >= 0 ? 'success.main' : 'error.main'}>{formatCurrency(portfolioSummary.totalGainLoss)}</Typography></CardContent></Card></Grid>
            <Grid item xs={6} md={3}><Card><CardContent><Typography color="textSecondary" variant="body2">Return %</Typography><Typography variant="h6" color={portfolioSummary.totalGainLossPercentage >= 0 ? 'success.main' : 'error.main'}>{portfolioSummary.totalGainLossPercentage.toFixed(2)}%</Typography></CardContent></Card></Grid>
          </Grid>
        )}

        {portfolio.length > 0 && portfolioSummary && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6">Allocation</Typography><Box sx={{ height: 300 }}><ResponsiveContainer><PieChart><Pie data={getPieChartData()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>{getPieChartData().map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip formatter={formatCurrency} /><Legend /></PieChart></ResponsiveContainer></Box></CardContent></Card></Grid>
            <Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6">Performance</Typography><Box sx={{ height: 300 }}><ResponsiveContainer><BarChart data={getPerformanceData()}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} /><Tooltip formatter={formatCurrency} /><Legend /><Bar dataKey="invested" fill="#ff7300" name="Invested" /><Bar dataKey="current" fill="#1976d2" name="Current" /></BarChart></ResponsiveContainer></Box></CardContent></Card></Grid>
          </Grid>
        )}

        <Card><CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Holdings ({portfolio.length})</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddHolding}>Add Holding</Button>
          </Box>

          {portfolio.length === 0 && !loading ? (<Alert severity="info">Your portfolio is empty.</Alert>) :
            (<TableContainer component={Paper} variant="outlined"><Table><TableHead><TableRow>
              <TableCell>Fund Name</TableCell><TableCell align="right">Units</TableCell><TableCell align="right">Avg. Price</TableCell><TableCell align="right">Invested</TableCell><TableCell align="right">Current NAV</TableCell><TableCell align="right">Current Value</TableCell><TableCell align="right">Gain/Loss</TableCell><TableCell align="right">Return %</TableCell><TableCell align="center">Actions</TableCell>
            </TableRow></TableHead><TableBody>
                {portfolioSummary?.holdings.map((holding) => (
                  <TableRow key={holding._id}>
                    <TableCell><Typography variant="body2">{holding.schemeName}</Typography><Typography variant="caption" color="text.secondary">{holding.schemeCode}</Typography></TableCell>
                    <TableCell align="right">{holding.units.toFixed(3)}</TableCell>
                    <TableCell align="right">{formatCurrency(holding.avgPrice)}</TableCell>
                    <TableCell align="right">{formatCurrency(holding.investedValue)}</TableCell>
                    <TableCell align="right">{holding.error ? <Chip label="Error" color="error" size="small" /> : formatCurrency(holding.currentNav)}</TableCell>
                    <TableCell align="right">{formatCurrency(holding.currentValue)}</TableCell>
                    <TableCell align="right" sx={{ color: holding.gainLoss >= 0 ? 'success.main' : 'error.main' }}>{formatCurrency(holding.gainLoss)}</TableCell>
                    <TableCell align="right" sx={{ color: holding.gainLossPercentage >= 0 ? 'success.main' : 'error.main' }}>{holding.gainLossPercentage.toFixed(2)}%</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEditHolding(holding)}><EditIcon /></IconButton>
                      <IconButton size="small" onClick={() => handleDeleteHolding(holding._id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody></Table></TableContainer>)}
        </CardContent></Card>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingHolding ? `Edit: ${editingHolding.schemeName}` : 'Add New Holding'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              {!editingHolding && (
                <Grid item xs={12}><Autocomplete options={funds} getOptionLabel={(o) => `${o.schemeName} (${o.schemeCode})`} onChange={handleFundSelect} renderInput={(p) => <TextField {...p} label="Select Fund" />} /></Grid>)}
              <Grid item xs={12} sm={6}><TextField fullWidth label="Units" type="number" value={formData.units} onChange={(e) => setFormData(p => ({ ...p, units: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Average Price (₹)" type="number" value={formData.avgPrice} onChange={(e) => setFormData(p => ({ ...p, avgPrice: e.target.value }))} /></Grid>
              <Grid item xs={12}><DatePicker label="Investment Date" value={formData.investmentDate} onChange={(d) => setFormData(p => ({ ...p, investmentDate: d }))} maxDate={dayjs()} sx={{ width: '100%' }} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveHolding} variant="contained" disabled={!formData.units || !formData.avgPrice || (!editingHolding && !formData.schemeCode)}>
              {editingHolding ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}