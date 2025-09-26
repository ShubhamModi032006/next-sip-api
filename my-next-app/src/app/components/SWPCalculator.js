'use client';
import { useState } from 'react';
import {
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';

export default function SWPCalculator({ schemeCode }) {
  const [formData, setFormData] = useState({
    initialInvestment: 500000,
    withdrawalAmount: 5000,
    frequency: 'monthly',
    from: dayjs().subtract(3, 'year'),
    to: dayjs()
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateSWP = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        initialInvestment: parseFloat(formData.initialInvestment),
        withdrawalAmount: parseFloat(formData.withdrawalAmount),
        frequency: formData.frequency,
        from: formData.from.format('YYYY-MM-DD'),
        to: formData.to.format('YYYY-MM-DD')
      };

      const response = await axios.post(`/api/scheme/${schemeCode}/swp`, payload);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate SWP returns');
      console.error('SWP calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value?.toFixed(2)}%`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        SWP Calculator (Systematic Withdrawal Plan)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Calculate regular withdrawals from your mutual fund investment while keeping the remaining amount invested.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Input Form */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Initial Investment (₹)"
                    type="number"
                    value={formData.initialInvestment}
                    onChange={(e) => handleInputChange('initialInvestment', e.target.value)}
                    inputProps={{ min: 10000, step: 10000 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Withdrawal Amount (₹)"
                    type="number"
                    value={formData.withdrawalAmount}
                    onChange={(e) => handleInputChange('withdrawalAmount', e.target.value)}
                    inputProps={{ min: 500, step: 500 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Withdrawal Frequency</InputLabel>
                    <Select
                      value={formData.frequency}
                      label="Withdrawal Frequency"
                      onChange={(e) => handleInputChange('frequency', e.target.value)}
                    >
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Investment Date"
                    value={formData.from}
                    onChange={(date) => handleInputChange('from', date)}
                    maxDate={dayjs().subtract(1, 'month')}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="End Date"
                    value={formData.to}
                    onChange={(date) => handleInputChange('to', date)}
                    minDate={formData.from?.add(3, 'month')}
                    maxDate={dayjs()}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={calculateSWP}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? <CircularProgress size={24} /> : 'Calculate SWP'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {result && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  SWP Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Initial Investment
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(result.initialInvestment)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Withdrawn
                    </Typography>
                    <Typography variant="h6" color="secondary">
                      {formatCurrency(result.totalWithdrawn)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Remaining Portfolio
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(result.finalPortfolioValue)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Value Received
                    </Typography>
                    <Typography variant="body1" color="primary">
                      {formatCurrency(result.totalValueReceived)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Withdrawals Made
                    </Typography>
                    <Typography variant="body1">
                      {result.withdrawalsCount}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Remaining Units
                    </Typography>
                    <Typography variant="body1">
                      {result.remainingUnits?.toFixed(3)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Total Return
                    </Typography>
                    <Typography 
                      variant="h6" 
                      color={result.totalReturn >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(result.totalReturn)} ({formatPercentage(result.totalReturnPercentage)})
                    </Typography>
                  </Grid>
                  
                  {result.annualizedReturn && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Annualized Return
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color={result.annualizedReturn >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatPercentage(result.annualizedReturn)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Portfolio Value Chart */}
        {result && result.withdrawalHistory && result.withdrawalHistory.length > 0 && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Portfolio Value Over Time
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.withdrawalHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(date) => dayjs(date).format('MMM YY')}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        labelFormatter={(date) => dayjs(date).format('DD MMM YYYY')}
                        formatter={(value, name) => [
                          formatCurrency(value),
                          name === 'portfolioValue' ? 'Portfolio Value' : 'Withdrawal Amount'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="portfolioValue" 
                        stroke="#1976d2" 
                        fill="#1976d2"
                        fillOpacity={0.3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="withdrawalAmount" 
                        stroke="#dc004e" 
                        fill="#dc004e"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Withdrawal History Table */}
        {result && result.withdrawalHistory && result.withdrawalHistory.length > 0 && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Withdrawal History (Last 10 Transactions)
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">NAV</TableCell>
                        <TableCell align="right">Units Redeemed</TableCell>
                        <TableCell align="right">Withdrawal</TableCell>
                        <TableCell align="right">Remaining Units</TableCell>
                        <TableCell align="right">Portfolio Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.withdrawalHistory.slice(-10).reverse().map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell>{dayjs(transaction.date).format('DD MMM YYYY')}</TableCell>
                          <TableCell align="right">₹{transaction.nav.toFixed(4)}</TableCell>
                          <TableCell align="right">{transaction.unitsRedeemed.toFixed(3)}</TableCell>
                          <TableCell align="right">{formatCurrency(transaction.withdrawalAmount)}</TableCell>
                          <TableCell align="right">{transaction.remainingUnits.toFixed(3)}</TableCell>
                          <TableCell align="right">{formatCurrency(transaction.portfolioValue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
