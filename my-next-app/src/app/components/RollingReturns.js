import { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Grid, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function RollingReturns({ schemeCode }) {
  const [period, setPeriod] = useState('1y');
  const [window, setWindow] = useState('1y');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRollingReturns = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await axios.get(`/api/scheme/${schemeCode}/rolling-returns?period=${period}&window=${window}`);
      setResult(response.data);
    } catch (err) {
      console.error('Rolling returns fetch failed:', err);
      setError(err.response?.data?.error || 'Failed to fetch rolling returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schemeCode) {
      fetchRollingReturns();
    }
  }, [schemeCode, period, window]);

  const formatChartData = (rollingReturns) => {
    return rollingReturns.map(item => ({
      date: item.date,
      return: item.annualizedReturn,
      period: item.period
    }));
  };

  const getReturnColor = (returnValue) => {
    if (returnValue > 15) return 'success';
    if (returnValue > 10) return 'info';
    if (returnValue > 5) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Rolling Returns Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Analyze rolling returns over different time periods to understand fund performance consistency
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Analysis Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="1y">1 Year</option>
            <option value="3y">3 Years</option>
            <option value="5y">5 Years</option>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Rolling Window"
            value={window}
            onChange={(e) => setWindow(e.target.value)}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="1y">1 Year</option>
            <option value="3y">3 Years</option>
            <option value="5y">5 Years</option>
          </TextField>
        </Grid>
      </Grid>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error: {error}
        </Typography>
      )}

      {result && !error && (
        <Box>
          {/* Statistics Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {result.statistics.average.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Return
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {result.statistics.maximum.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Best Return
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error.main">
                    {result.statistics.minimum.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Worst Return
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {result.statistics.volatility.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Volatility
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Chart */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rolling Returns Chart
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData(result.rollingReturns)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(2)}%`, 'Annualized Return']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="return" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Rolling Return"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Percentile Analysis */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Percentile Analysis
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {result.statistics.p25.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      25th Percentile
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {result.statistics.p50.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Median (50th Percentile)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {result.statistics.p75.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      75th Percentile
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Recent Returns Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Rolling Returns
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>End Date</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>Period (Days)</TableCell>
                      <TableCell align="right">Annualized Return</TableCell>
                      <TableCell align="right">Start NAV</TableCell>
                      <TableCell align="right">End NAV</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.rollingReturns.slice(-20).reverse().map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.startDate}</TableCell>
                        <TableCell>{item.period}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${item.annualizedReturn.toFixed(2)}%`}
                            color={getReturnColor(item.annualizedReturn)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">₹{item.startNav.toFixed(4)}</TableCell>
                        <TableCell align="right">₹{item.endNav.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
