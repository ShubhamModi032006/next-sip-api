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
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';

export default function SIPCalculator({ schemeCode }) {
  const [formData, setFormData] = useState({
    amount: 5000,
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

  const calculateSIP = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        from: formData.from.format('YYYY-MM-DD'),
        to: formData.to.format('YYYY-MM-DD')
      };

      const response = await axios.post(`/api/scheme/${schemeCode}/sip`, payload);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate SIP returns');
      console.error('SIP calculation error:', err);
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
        SIP Calculator
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
                    label="SIP Amount (₹)"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    inputProps={{ min: 500, step: 500 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={formData.frequency}
                      label="Frequency"
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
                    label="Start Date"
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
                    minDate={formData.from?.add(1, 'month')}
                    maxDate={dayjs()}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={calculateSIP}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? <CircularProgress size={24} /> : 'Calculate SIP Returns'}
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
                  SIP Investment Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Invested
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(result.totalInvested)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Current Value
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(result.currentValue)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Units
                    </Typography>
                    <Typography variant="body1">
                      {result.totalUnits?.toFixed(3)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Absolute Return
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color={result.absoluteReturn >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatPercentage(result.absoluteReturn)}
                    </Typography>
                  </Grid>
                  
                  {result.annualizedReturn && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Annualized Return
                      </Typography>
                      <Typography 
                        variant="h6" 
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

        {/* Investment Growth Chart */}
        {result && result.investmentHistory && result.investmentHistory.length > 0 && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Investment Growth Over Time
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.investmentHistory}>
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
                          name === 'invested' ? 'Total Invested' : 'Portfolio Value'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="invested" 
                        stackId="1"
                        stroke="#ff7300" 
                        fill="#ff7300"
                        fillOpacity={0.3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stackId="2"
                        stroke="#1976d2" 
                        fill="#1976d2"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
