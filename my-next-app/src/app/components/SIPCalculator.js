import { useState } from 'react';
import { TextField, Button, Grid, Typography, Box, Card, CardContent } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axios from 'axios';

// A robust function to format numbers into Indian Rupee currency format
const formatToIndianCurrency = (number) => {
  // Ensure the input is a number, default to 0 if not.
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


export default function SIPCalculator({ schemeCode }) {
  const [amount, setAmount] = useState(5000);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs().add(1, 'year'));
  const [frequency, setFrequency] = useState('monthly');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateSIP = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`/api/scheme/${schemeCode}/sip`, {
        amount,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        frequency
      });

      setResult(response.data);
    } catch (err) {
      console.error('SIP calculation failed:', err);
      setError(err.response?.data?.error || 'SIP calculation failed');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate total investment on the client-side for accuracy
  const calculateTotalInvestment = () => {
    if (!startDate || !endDate || !amount || !frequency) return 0;

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    let months = end.diff(start, 'month');
    
    // Dayjs diff is exclusive, so if dates are 10th Mar 2025 and 10th Mar 2026, it gives 12. 
    // We need to check if we should include the last month's installment.
    // A simple approach is to add a day to the end date for an inclusive count.
    const inclusiveEndDate = end.add(1, 'day');
    months = inclusiveEndDate.diff(start, 'month');


    let installments = 0;
    switch (frequency) {
        case 'monthly':
            installments = months;
            break;
        case 'quarterly':
            installments = Math.floor(months / 3);
            break;
        case 'yearly':
            installments = Math.floor(months / 12);
            break;
        default:
            installments = 0;
    }
    
    // Ensure at least one installment is counted if dates are valid
    if (installments === 0 && end.isAfter(start)) {
        installments = 1;
    }

    return Number(amount) * installments;
  };


  // Derived values calculated on the client-side for accuracy
  const totalInvestment = result ? calculateTotalInvestment() : 0;
  const wealthGained = result ? result.finalValue - totalInvestment : 0;


  return (
    <Box sx={{ p: 3, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        SIP Calculator
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
            onClick={calculateSIP}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Calculating...' : 'Calculate SIP'}
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
              Investment Summary
            </Typography>
            <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body1" gutterBottom>
                    Total Amount Invested: <strong>{formatToIndianCurrency(totalInvestment)}</strong>
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Total Wealth Gained: <strong>{formatToIndianCurrency(wealthGained)}</strong>
                  </Typography>
                  <Typography variant="h6" gutterBottom color="primary">
                    Maturity Value: <strong>{formatToIndianCurrency(result.finalValue)}</strong>
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Growth Multiple: <strong>{(result.finalValue / totalInvestment).toFixed(2)}x</strong>
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6} sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Total Invested', value: totalInvestment },
                        // Ensure wealth gained is not negative for the chart
                        { name: 'Wealth Gained', value: Math.max(0, wealthGained) },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                    >
                      <Cell fill="#8884d8" />
                      <Cell fill="#82ca9d" />
                    </Pie>
                    <Tooltip formatter={(value) => formatToIndianCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
