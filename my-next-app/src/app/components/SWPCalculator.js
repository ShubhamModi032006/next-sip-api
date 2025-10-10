import { useState } from 'react';
import { TextField, Button, Grid, Typography, Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axios from 'axios';

export default function SWPCalculator({ schemeCode }) {
  const [amount, setAmount] = useState(1000000);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs().add(10, 'year'));
  const [frequency, setFrequency] = useState('monthly');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateSWP = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await axios.post(`/api/scheme/${schemeCode}/swp`, {
        amount,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        frequency
      });
      
      setResult(response.data);
    } catch (err) {
      console.error('SWP calculation failed:', err);
      setError(err.response?.data?.error || 'SWP calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        SWP Calculator
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Initial Investment (₹)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Withdrawal Frequency"
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
            onClick={calculateSWP}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Calculating...' : 'Calculate SWP'}
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
          <Typography variant="h6" gutterBottom>SWP Investment Result</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Investment Summary</Typography>
              <Typography>Initial Investment: ₹{result.initialAmount.toLocaleString()}</Typography>
              <Typography>Total Withdrawn: ₹{result.totalWithdrawn.toLocaleString()}</Typography>
              <Typography>Remaining Value: ₹{result.finalValue.toLocaleString()}</Typography>
              <Typography color="primary" sx={{ fontWeight: 'bold' }}>
                Total Value: ₹{result.totalValue.toLocaleString()}
              </Typography>
              <Typography>Total Gain: ₹{result.totalGain.toLocaleString()}</Typography>
              <Typography>Gain Percentage: {result.totalGainPercentage.toFixed(2)}%</Typography>
              <Typography>CAGR: {result.cagr.toFixed(2)}%</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Withdrawal Details</Typography>
              <Typography>Withdrawals: {result.withdrawals}</Typography>
              <Typography>Average Withdrawal: ₹{result.summary.averageWithdrawalAmount.toLocaleString()}</Typography>
              <Typography>Initial Units: {result.initialUnits.toFixed(4)}</Typography>
              <Typography>Remaining Units: {result.remainingUnits.toFixed(4)}</Typography>
              <Typography>Units Withdrawn: {result.summary.totalUnitsWithdrawn.toFixed(4)}</Typography>
              <Typography>Average NAV: ₹{result.summary.averageNAV.toFixed(4)}</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Investment Period</Typography>
              <Typography>Start Date: {result.startDate}</Typography>
              <Typography>End Date: {result.endDate}</Typography>
              <Typography>Frequency: {result.frequency}</Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}