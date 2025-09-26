'use client';
import { useState } from 'react';
import {
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';

export default function LumpsumCalculator({ schemeCode }) {
  const [formData, setFormData] = useState({
    amount: 100000,
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

  const calculateLumpsum = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        amount: parseFloat(formData.amount),
        from: formData.from.format('YYYY-MM-DD'),
        to: formData.to.format('YYYY-MM-DD')
      };

      const response = await axios.post(`/api/scheme/${schemeCode}/lumpsum`, payload);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate lumpsum returns');
      console.error('Lumpsum calculation error:', err);
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
        Lumpsum Calculator
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
                    label="Investment Amount (₹)"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    inputProps={{ min: 1000, step: 1000 }}
                  />
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
                    label="Redemption Date"
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
                    onClick={calculateLumpsum}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? <CircularProgress size={24} /> : 'Calculate Lumpsum Returns'}
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
                  Lumpsum Investment Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Invested Amount
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(result.investedAmount)}
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
                      Units Purchased
                    </Typography>
                    <Typography variant="body1">
                      {result.units?.toFixed(3)}
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
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Purchase NAV
                    </Typography>
                    <Typography variant="body1">
                      ₹{result.startNAV?.toFixed(4)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Current NAV
                    </Typography>
                    <Typography variant="body1">
                      ₹{result.endNAV?.toFixed(4)}
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

        {/* Growth Chart */}
        {result && result.growthHistory && result.growthHistory.length > 0 && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Investment Value Over Time
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.growthHistory}>
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
                          name === 'value' ? 'Portfolio Value' : 'NAV'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#1976d2" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Gain: {formatCurrency(result.currentValue - result.investedAmount)} 
                    ({formatPercentage(result.absoluteReturn)})
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
