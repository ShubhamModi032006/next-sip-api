import { useState } from 'react';
import { TextField, Button, Grid, Typography, Box, Card, CardContent, Divider } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axios from 'axios';

// A robust function to format numbers into Indian Rupee currency format
const formatToIndianCurrency = (number) => {
  const numericValue = Number(number);
  if (isNaN(numericValue)) {
    return '₹ 0';
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(numericValue);
};

export default function StepUpSIPCalculator({ schemeCode }) {
  const [initialAmount, setInitialAmount] = useState(5000);
  const [stepUpAmount, setStepUpAmount] = useState(500);
  const [stepUpFrequency, setStepUpFrequency] = useState('yearly');
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs().add(5, 'year'));
  const [frequency, setFrequency] = useState('monthly');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateStepUpSIP = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`/api/scheme/${schemeCode}/stepup-sip`, {
        initialAmount,
        stepUpAmount,
        stepUpFrequency,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        frequency
      });

      setResult(response.data);
    } catch (err) {
      console.error('Step-up SIP calculation failed:', err);
      setError(err.response?.data?.error || 'Step-up SIP calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Step-up SIP Calculator
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Calculate returns for SIP with periodic step-up in investment amount
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Initial SIP Amount (₹)"
            type="number"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Step-up Amount (₹)"
            type="number"
            value={stepUpAmount}
            onChange={(e) => setStepUpAmount(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Step-up Frequency"
            value={stepUpFrequency}
            onChange={(e) => setStepUpFrequency(e.target.value)}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="yearly">Yearly</option>
            <option value="half-yearly">Half-yearly</option>
            <option value="quarterly">Quarterly</option>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="SIP Frequency"
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
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            minDate={startDate.add(1, 'month')}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={calculateStepUpSIP}
            disabled={loading}
            fullWidth
            size="large"
          >
            {loading ? 'Calculating...' : 'Calculate Step-up SIP'}
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error: {error}
        </Typography>
      )}

      {result && !error && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h5" component="h3" gutterBottom align="center">
              Step-up SIP Investment Summary
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="primary">
                  Investment Details
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Total Investment: <strong>{formatToIndianCurrency(result.totalInvestment)}</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Final Value: <strong>{formatToIndianCurrency(result.finalValue)}</strong>
                </Typography>
                <Typography variant="body1" gutterBottom color="success.main">
                  Total Gain: <strong>{formatToIndianCurrency(result.totalGain)}</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Gain Percentage: <strong>{result.totalGainPercentage.toFixed(2)}%</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  CAGR: <strong>{result.cagr.toFixed(2)}%</strong>
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="primary">
                  Step-up Information
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Initial Amount: <strong>{formatToIndianCurrency(result.initialAmount)}</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Final Amount: <strong>{formatToIndianCurrency(result.finalAmount)}</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Step-up Amount: <strong>{formatToIndianCurrency(result.stepUpAmount)}</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Step-up Frequency: <strong>{result.stepUpFrequency}</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Step-ups Applied: <strong>{result.stepUpCount}</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Total Installments: <strong>{result.installments}</strong>
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom color="primary">
                  Investment Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Average Monthly Investment
                    </Typography>
                    <Typography variant="h6">
                      {formatToIndianCurrency(result.summary.averageMonthlyInvestment)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total Units Purchased
                    </Typography>
                    <Typography variant="h6">
                      {result.summary.totalUnitsPurchased.toFixed(4)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Average NAV
                    </Typography>
                    <Typography variant="h6">
                      ₹{result.summary.averageNAV.toFixed(4)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom color="primary">
                  Investment Period
                </Typography>
                <Typography variant="body1">
                  From <strong>{result.startDate}</strong> to <strong>{result.endDate}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  SIP Frequency: {result.frequency}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
