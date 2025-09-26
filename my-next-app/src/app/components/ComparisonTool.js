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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';

export default function ComparisonTool({ schemeCode }) {
  const [formData, setFormData] = useState({
    sipAmount: 5000,
    lumpsumAmount: 100000,
    from: dayjs().subtract(3, 'year'),
    to: dayjs()
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const compareInvestments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sipPayload = {
        amount: parseFloat(formData.sipAmount),
        frequency: 'monthly',
        from: formData.from.format('YYYY-MM-DD'),
        to: formData.to.format('YYYY-MM-DD')
      };

      const lumpsumPayload = {
        amount: parseFloat(formData.lumpsumAmount),
        from: formData.from.format('YYYY-MM-DD'),
        to: formData.to.format('YYYY-MM-DD')
      };

      const [sipResponse, lumpsumResponse] = await Promise.all([
        axios.post(`/api/scheme/${schemeCode}/sip`, sipPayload),
        axios.post(`/api/scheme/${schemeCode}/lumpsum`, lumpsumPayload)
      ]);

      setResults({
        sip: sipResponse.data,
        lumpsum: lumpsumResponse.data
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to compare investments');
      console.error('Comparison error:', err);
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

  const getChartData = () => {
    if (!results) return [];
    
    return [
      {
        name: 'SIP',
        invested: results.sip.totalInvested,
        currentValue: results.sip.currentValue,
        returns: results.sip.currentValue - results.sip.totalInvested
      },
      {
        name: 'Lumpsum',
        invested: results.lumpsum.investedAmount,
        currentValue: results.lumpsum.currentValue,
        returns: results.lumpsum.currentValue - results.lumpsum.investedAmount
      }
    ];
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        SIP vs Lumpsum Comparison
      </Typography>
      
      <Grid container spacing={3}>
        {/* Input Form */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Investment Parameters
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Monthly SIP Amount (₹)"
                    type="number"
                    value={formData.sipAmount}
                    onChange={(e) => handleInputChange('sipAmount', e.target.value)}
                    inputProps={{ min: 500, step: 500 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Lumpsum Amount (₹)"
                    type="number"
                    value={formData.lumpsumAmount}
                    onChange={(e) => handleInputChange('lumpsumAmount', e.target.value)}
                    inputProps={{ min: 1000, step: 1000 }}
                  />
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
                    onClick={compareInvestments}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? <CircularProgress size={24} /> : 'Compare Investments'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Summary */}
        <Grid item xs={12} md={6}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {results && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom color="primary">
                  Comparison Summary
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">SIP</TableCell>
                        <TableCell align="right">Lumpsum</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Amount Invested</TableCell>
                        <TableCell align="right">
                          {formatCurrency(results.sip.totalInvested)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(results.lumpsum.investedAmount)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Current Value</TableCell>
                        <TableCell align="right">
                          {formatCurrency(results.sip.currentValue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(results.lumpsum.currentValue)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Absolute Gain</TableCell>
                        <TableCell align="right">
                          {formatCurrency(results.sip.currentValue - results.sip.totalInvested)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(results.lumpsum.currentValue - results.lumpsum.investedAmount)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Absolute Return</TableCell>
                        <TableCell align="right">
                          {formatPercentage(results.sip.absoluteReturn)}
                        </TableCell>
                        <TableCell align="right">
                          {formatPercentage(results.lumpsum.absoluteReturn)}
                        </TableCell>
                      </TableRow>
                      {results.sip.annualizedReturn && results.lumpsum.annualizedReturn && (
                        <TableRow>
                          <TableCell>Annualized Return</TableCell>
                          <TableCell align="right">
                            {formatPercentage(results.sip.annualizedReturn)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercentage(results.lumpsum.annualizedReturn)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Winner:</strong> {' '}
                    {results.sip.currentValue > results.lumpsum.currentValue ? 'SIP' : 'Lumpsum'} 
                    {' '} strategy performed better with {' '}
                    {results.sip.currentValue > results.lumpsum.currentValue 
                      ? formatCurrency(results.sip.currentValue - results.lumpsum.currentValue)
                      : formatCurrency(results.lumpsum.currentValue - results.sip.currentValue)
                    } higher returns.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Comparison Chart */}
        {results && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Investment Comparison Chart
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="invested" fill="#ff7300" name="Amount Invested" />
                      <Bar dataKey="currentValue" fill="#1976d2" name="Current Value" />
                    </BarChart>
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
