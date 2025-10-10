import { useState } from 'react';
import { TextField, Button, Grid, Typography, Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axios from 'axios';

export default function LumpsumCalculator({ schemeCode }) {
  const [amount, setAmount] = useState(100000);
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'year'));
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateLumpsum = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await axios.post(`/api/scheme/${schemeCode}/lumpsum`, {
        amount,
        startDate: startDate.format('YYYY-MM-DD')
      });
      
      setResult(response.data);
    } catch (err) {
      console.error('Lumpsum calculation failed:', err);
      setError(err.response?.data?.error || 'Lumpsum calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Lumpsum Calculator
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
          <DatePicker
            label="Investment Date"
            value={startDate}
            onChange={setStartDate}
            maxDate={dayjs()}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Button 
            variant="contained" 
            onClick={calculateLumpsum}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Calculating...' : 'Calculate Lumpsum'}
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error: {error}
        </Typography>
      )}

      {result && !error && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>Lumpsum Investment Result</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Investment Details</Typography>
              <Typography>Initial Investment: ₹{result.initialInvestment.toLocaleString()}</Typography>
              <Typography>Current Value: ₹{result.currentValue.toLocaleString()}</Typography>
              <Typography color="primary" sx={{ fontWeight: 'bold' }}>
                Total Growth: ₹{result.growth.toLocaleString()}
              </Typography>
              <Typography>Growth Percentage: {result.growthPercentage.toFixed(2)}%</Typography>
              <Typography>CAGR: {result.cagr.toFixed(2)}%</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>NAV Information</Typography>
              <Typography>Investment NAV: ₹{result.investmentNav.toFixed(4)}</Typography>
              <Typography>Current NAV: ₹{result.currentNav.toFixed(4)}</Typography>
              <Typography>Units Purchased: {result.unitsPurchased.toFixed(4)}</Typography>
              <Typography>Absolute Return: {result.absoluteReturn.toFixed(2)}%</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Investment Period</Typography>
              <Typography>Investment Date: {result.investmentDate}</Typography>
              <Typography>Current Date: {result.currentDate}</Typography>
              <Typography>Investment Duration: {result.investmentPeriod.years.toFixed(2)} years ({result.investmentPeriod.days} days)</Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}