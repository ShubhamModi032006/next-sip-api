import { useState } from 'react';
import { TextField, Button, Grid, Typography, Box, Divider, Card, CardContent } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axios from 'axios';

export default function ComparisonTool({ schemeCode }) {
  const [amount, setAmount] = useState(5000);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs().add(5, 'year'));
  const [frequency, setFrequency] = useState('monthly');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const compareInvestments = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await axios.post(`/api/scheme/${schemeCode}/comparison`, {
        amount,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        frequency
      });
      
      setResult(response.data);
    } catch (err) {
      console.error('Comparison calculation failed:', err);
      setError(err.response?.data?.error || 'Comparison calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        SIP vs Lumpsum Comparison
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Investment Amount (₹)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            minDate={startDate.add(1, 'month')}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Button 
            variant="contained" 
            onClick={compareInvestments}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Calculating...' : 'Compare Investments'}
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error: {error}
        </Typography>
      )}

      {result && !error && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>Investment Comparison Results</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Period: {result.summary.period.start} to {result.summary.period.end} ({result.summary.period.years} years)
          </Typography>
          
          <Grid container spacing={2}>
            {/* SIP */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    SIP Investment
                  </Typography>
                  <Typography variant="h4" color="primary">
                    ₹{result.comparison.sip.finalValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Final Value
                  </Typography>
                  <Typography variant="body1">
                    Invested: ₹{result.comparison.sip.totalInvestment.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    Gain: ₹{result.comparison.sip.gain.toLocaleString()}
                  </Typography>
                  <Typography variant="body1">
                    Gain: {result.comparison.sip.gainPercentage.toFixed(2)}%
                  </Typography>
                  <Typography variant="body1">
                    CAGR: {result.comparison.sip.cagr.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Installments: {result.comparison.sip.installments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Lumpsum */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Lumpsum Investment
                  </Typography>
                  <Typography variant="h4" color="primary">
                    ₹{result.comparison.lumpsum.finalValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Final Value
                  </Typography>
                  <Typography variant="body1">
                    Invested: ₹{result.comparison.lumpsum.totalInvestment.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    Gain: ₹{result.comparison.lumpsum.gain.toLocaleString()}
                  </Typography>
                  <Typography variant="body1">
                    Gain: {result.comparison.lumpsum.gainPercentage.toFixed(2)}%
                  </Typography>
                  <Typography variant="body1">
                    CAGR: {result.comparison.lumpsum.cagr.toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* SWP */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    SWP Investment
                  </Typography>
                  <Typography variant="h4" color="primary">
                    ₹{result.comparison.swp.totalValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Value
                  </Typography>
                  <Typography variant="body1">
                    Invested: ₹{result.comparison.swp.totalInvestment.toLocaleString()}
                  </Typography>
                  <Typography variant="body1">
                    Withdrawn: ₹{result.comparison.swp.totalWithdrawn.toLocaleString()}
                  </Typography>
                  <Typography variant="body1">
                    Remaining: ₹{result.comparison.swp.finalValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    Gain: ₹{result.comparison.swp.gain.toLocaleString()}
                  </Typography>
                  <Typography variant="body1">
                    CAGR: {result.comparison.swp.cagr.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Withdrawals: {result.comparison.swp.withdrawals}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Step-up SIP */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Step-up SIP
                  </Typography>
                  <Typography variant="h4" color="primary">
                    ₹{result.comparison.stepUpSip.finalValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Final Value
                  </Typography>
                  <Typography variant="body1">
                    Invested: ₹{result.comparison.stepUpSip.totalInvestment.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    Gain: ₹{result.comparison.stepUpSip.gain.toLocaleString()}
                  </Typography>
                  <Typography variant="body1">
                    Gain: {result.comparison.stepUpSip.gainPercentage.toFixed(2)}%
                  </Typography>
                  <Typography variant="body1">
                    CAGR: {result.comparison.stepUpSip.cagr.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Step-ups: {result.comparison.stepUpSip.stepUpCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Winner */}
          <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h5" align="center" gutterBottom>
                🏆 Best Performer: {result.summary.bestPerformer.name}
              </Typography>
              <Typography variant="h6" align="center">
                Final Value: ₹{result.summary.bestPerformer.value.toLocaleString()}
              </Typography>
              <Typography variant="body1" align="center">
                CAGR: {result.summary.bestPerformer.cagr.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}