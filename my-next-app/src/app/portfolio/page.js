'use client';
import { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import dayjs from 'dayjs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState([]);
  const [funds, setFunds] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [formData, setFormData] = useState({
    schemeCode: '',
    schemeName: '',
    units: '',
    avgPrice: '',
    investmentDate: dayjs()
  });
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFunds();
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (portfolio.length > 0) {
      calculatePortfolioSummary();
    }
  }, [portfolio]);

  const fetchFunds = async () => {
    try {
      const response = await axios.get('/api/mf');
      setFunds(response.data);
    } catch (error) {
      console.error('Error fetching funds:', error);
    }
  };

  const loadPortfolio = () => {
    const savedPortfolio = localStorage.getItem('mutualFundPortfolio');
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio));
    }
  };

  const savePortfolio = (newPortfolio) => {
    localStorage.setItem('mutualFundPortfolio', JSON.stringify(newPortfolio));
    setPortfolio(newPortfolio);
  };

  const calculatePortfolioSummary = async () => {
    setLoading(true);
    try {
      const summaryPromises = portfolio.map(async (holding) => {
        try {
          const response = await axios.get(`/api/scheme/${holding.schemeCode}`);
          const latestNav = response.data.data[0];
          const currentValue = holding.units * parseFloat(latestNav.nav);
          const investedValue = holding.units * holding.avgPrice;
          const gainLoss = currentValue - investedValue;
          const gainLossPercentage = (gainLoss / investedValue) * 100;

          return {
            ...holding,
            currentNav: parseFloat(latestNav.nav),
            currentValue,
            investedValue,
            gainLoss,
            gainLossPercentage,
            lastUpdated: latestNav.date
          };
        } catch (error) {
          console.error(`Error fetching data for ${holding.schemeCode}:`, error);
          return {
            ...holding,
            currentNav: holding.avgPrice,
            currentValue: holding.units * holding.avgPrice,
            investedValue: holding.units * holding.avgPrice,
            gainLoss: 0,
            gainLossPercentage: 0,
            error: true
          };
        }
      });

      const updatedHoldings = await Promise.all(summaryPromises);
      
      const totalInvested = updatedHoldings.reduce((sum, holding) => sum + holding.investedValue, 0);
      const totalCurrent = updatedHoldings.reduce((sum, holding) => sum + holding.currentValue, 0);
      const totalGainLoss = totalCurrent - totalInvested;
      const totalGainLossPercentage = (totalGainLoss / totalInvested) * 100;

      setPortfolioSummary({
        holdings: updatedHoldings,
        totalInvested,
        totalCurrent,
        totalGainLoss,
        totalGainLossPercentage,
        holdingsCount: updatedHoldings.length
      });
    } catch (error) {
      console.error('Error calculating portfolio summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHolding = () => {
    setFormData({
      schemeCode: '',
      schemeName: '',
      units: '',
      avgPrice: '',
      investmentDate: dayjs()
    });
    setEditingIndex(-1);
    setOpenDialog(true);
  };

  const handleEditHolding = (index) => {
    const holding = portfolio[index];
    setFormData({
      schemeCode: holding.schemeCode,
      schemeName: holding.schemeName,
      units: holding.units.toString(),
      avgPrice: holding.avgPrice.toString(),
      investmentDate: dayjs(holding.investmentDate)
    });
    setEditingIndex(index);
    setOpenDialog(true);
  };

  const handleDeleteHolding = (index) => {
    const newPortfolio = portfolio.filter((_, i) => i !== index);
    savePortfolio(newPortfolio);
  };

  const handleSaveHolding = () => {
    const newHolding = {
      schemeCode: formData.schemeCode,
      schemeName: formData.schemeName,
      units: parseFloat(formData.units),
      avgPrice: parseFloat(formData.avgPrice),
      investmentDate: formData.investmentDate.format('YYYY-MM-DD')
    };

    let newPortfolio;
    if (editingIndex >= 0) {
      newPortfolio = [...portfolio];
      newPortfolio[editingIndex] = newHolding;
    } else {
      newPortfolio = [...portfolio, newHolding];
    }

    savePortfolio(newPortfolio);
    setOpenDialog(false);
  };

  const handleFundSelect = (schemeCode) => {
    const selectedFund = funds.find(fund => fund.schemeCode === schemeCode);
    if (selectedFund) {
      setFormData(prev => ({
        ...prev,
        schemeCode: schemeCode,
        schemeName: selectedFund.schemeName
      }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPieChartData = () => {
    if (!portfolioSummary) return [];
    return portfolioSummary.holdings.map((holding, index) => ({
      name: holding.schemeName.substring(0, 30) + '...',
      value: holding.currentValue,
      color: COLORS[index % COLORS.length]
    }));
  };

  const getPerformanceData = () => {
    if (!portfolioSummary) return [];
    return portfolioSummary.holdings.map(holding => ({
      name: holding.schemeName.substring(0, 20) + '...',
      invested: holding.investedValue,
      current: holding.currentValue,
      gainLoss: holding.gainLoss
    }));
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        My Portfolio
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Track your mutual fund investments and monitor performance
      </Typography>

      {/* Portfolio Summary Cards */}
      {portfolioSummary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Invested
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(portfolioSummary.totalInvested)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Current Value
                </Typography>
                <Typography variant="h5" color="primary">
                  {formatCurrency(portfolioSummary.totalCurrent)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Gain/Loss
                </Typography>
                <Typography 
                  variant="h5" 
                  color={portfolioSummary.totalGainLoss >= 0 ? 'success.main' : 'error.main'}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  {portfolioSummary.totalGainLoss >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  {formatCurrency(Math.abs(portfolioSummary.totalGainLoss))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Return %
                </Typography>
                <Typography 
                  variant="h5" 
                  color={portfolioSummary.totalGainLossPercentage >= 0 ? 'success.main' : 'error.main'}
                >
                  {portfolioSummary.totalGainLossPercentage.toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      {portfolioSummary && portfolioSummary.holdings.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Portfolio Allocation
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Comparison
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getPerformanceData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="invested" fill="#ff7300" name="Invested" />
                      <Bar dataKey="current" fill="#1976d2" name="Current Value" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Holdings Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Holdings ({portfolio.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddHolding}
            >
              Add Holding
            </Button>
          </Box>

          {portfolio.length === 0 ? (
            <Alert severity="info">
              No holdings added yet. Click "Add Holding" to start tracking your investments.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fund Name</TableCell>
                    <TableCell align="right">Units</TableCell>
                    <TableCell align="right">Avg Price</TableCell>
                    <TableCell align="right">Invested</TableCell>
                    <TableCell align="right">Current NAV</TableCell>
                    <TableCell align="right">Current Value</TableCell>
                    <TableCell align="right">Gain/Loss</TableCell>
                    <TableCell align="right">Return %</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolioSummary?.holdings.map((holding, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {holding.schemeName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {holding.schemeCode}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{holding.units.toFixed(3)}</TableCell>
                      <TableCell align="right">₹{holding.avgPrice.toFixed(4)}</TableCell>
                      <TableCell align="right">{formatCurrency(holding.investedValue)}</TableCell>
                      <TableCell align="right">
                        ₹{holding.currentNav.toFixed(4)}
                        {holding.error && <Chip label="Error" color="error" size="small" sx={{ ml: 1 }} />}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(holding.currentValue)}</TableCell>
                      <TableCell align="right">
                        <Typography 
                          color={holding.gainLoss >= 0 ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency(holding.gainLoss)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          color={holding.gainLossPercentage >= 0 ? 'success.main' : 'error.main'}
                        >
                          {holding.gainLossPercentage.toFixed(2)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleEditHolding(index)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteHolding(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex >= 0 ? 'Edit Holding' : 'Add New Holding'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Fund</InputLabel>
                <Select
                  value={formData.schemeCode}
                  label="Select Fund"
                  onChange={(e) => handleFundSelect(e.target.value)}
                >
                  {funds.slice(0, 100).map((fund) => (
                    <MenuItem key={fund.schemeCode} value={fund.schemeCode}>
                      {fund.schemeName} ({fund.schemeCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Units"
                type="number"
                value={formData.units}
                onChange={(e) => setFormData(prev => ({ ...prev, units: e.target.value }))}
                inputProps={{ min: 0, step: 0.001 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Average Price (₹)"
                type="number"
                value={formData.avgPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, avgPrice: e.target.value }))}
                inputProps={{ min: 0, step: 0.0001 }}
              />
            </Grid>
            <Grid item xs={12}>
              <DatePicker
                label="Investment Date"
                value={formData.investmentDate}
                onChange={(date) => setFormData(prev => ({ ...prev, investmentDate: date }))}
                maxDate={dayjs()}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveHolding} 
            variant="contained"
            disabled={!formData.schemeCode || !formData.units || !formData.avgPrice}
          >
            {editingIndex >= 0 ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
