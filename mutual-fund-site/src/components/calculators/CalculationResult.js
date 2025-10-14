import { Box, Grid, Alert, Paper, Typography, CircularProgress } from '@mui/material';
import { AreaChart, BarChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Bar } from 'recharts';
import StatCard from './StatCard';

// Helper function to format dates consistently for chart axes
const formatChartDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
// Helper function to format large currency values for display
const formatValue = (value) => `₹${Math.round(value).toLocaleString('en-IN')}`;

/**
 * A "smart" component that displays the results for any calculator.
 * It inspects the `result.type` and renders the appropriate UI.
 * @param {object} props - The component props.
 * @param {object} props.result - The calculation result object from the API.
 * @param {string} props.error - An error message, if any.
 * @param {boolean} props.loading - A boolean indicating if a calculation is in progress.
 */
export default function CalculationResult({ result, error, loading }) {
  // 1. Handle loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // 2. Handle error state
  if (error) {
    return <Alert severity="error">Error: {error}</Alert>;
  }

  // 3. Handle initial/empty state
  if (!result) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', height: '100%', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          Enter your investment details and click "Calculate" to see your personalized projection.
        </Typography>
      </Paper>
    );
  }

  const { type, data } = result;

  // --- Display Logic for SIP, Step-Up SIP, and Lumpsum ---
  if (['sip', 'stepup-sip', 'lumpsum'].includes(type)) {
    const isPositive = data.profit >= 0;
    const returnColor = isPositive ? 'success.main' : 'error.main';
    // Build chart data: use investmentGrowth if present (SIP/Step-Up SIP), otherwise synthesize for Lumpsum
    const chartData = data.investmentGrowth ?? (
      type === 'lumpsum' && data.startDateNav && data.endDateNav
        ? [
            { date: data.startDateNav.date, invested: data.totalInvested, value: data.totalInvested },
            { date: data.endDateNav.date, invested: data.totalInvested, value: (data.totalInvested / data.startDateNav.nav) * data.endDateNav.nav }
          ]
        : null
    );
    return (
      <Box>
        <Grid container spacing={2} mb={4}>
          <Grid item xs={6} md={4}><StatCard title="Amount Invested" value={formatValue(data.totalInvested)} /></Grid>
          <Grid item xs={6} md={4}><StatCard title="Final Value" value={formatValue(data.finalValue)} /></Grid>
          <Grid item xs={12} md={4}><StatCard title="Profit" value={formatValue(data.profit)} color={returnColor} /></Grid>
          <Grid item xs={6} md={6}><StatCard title="Absolute Return" value={`${data.absoluteReturn.toFixed(2)}%`} color={returnColor} /></Grid>
          <Grid item xs={6} md={6}><StatCard title="Annualized (CAGR)" value={data.annualizedReturn ? `${data.annualizedReturn.toFixed(2)}%` : 'N/A'} subValue={!data.annualizedReturn ? '(for >1Y)' : null} color={returnColor} tooltip="Compounded Annual Growth Rate shows the average yearly growth of your investment." /></Grid>
        </Grid>
        {chartData && (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatChartDate} />
              <YAxis tickFormatter={(val) => `₹${(val / 100000).toFixed(val > 99999 ? 1 : 2)}L`} />
              <Tooltip formatter={(value) => formatValue(value)} />
              <Legend />
              <Area type="monotone" name="Total Value" dataKey="value" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" name="Amount Invested" dataKey="invested" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Box>
    );
  }

  // --- Display Logic for SWP and Step-Up SWP ---
  if (['swp', 'stepup-swp'].includes(type)) {
    // Build chart data for SWP variants
    const chartData = data.portfolioGrowth ?? null;
    const isPositive = data.profit >= 0;
    const returnColor = isPositive ? 'success.main' : 'error.main';
    return (
      <Box>
        <Grid container spacing={2} mb={4}>
            <Grid item xs={6} sm={3}><StatCard title="Initial Investment" value={formatValue(data.initialInvestment)} /></Grid>
            <Grid item xs={6} sm={3}><StatCard title="Total Withdrawn" value={formatValue(data.totalWithdrawn)} tooltip="The total amount you received from all withdrawals." /></Grid>
            <Grid item xs={6} sm={3}><StatCard title="Final Value" value={formatValue(data.finalValue)} tooltip="The value of your remaining investment at the end of the period." /></Grid>
            <Grid item xs={6} sm={3}><StatCard title="Total Profit" value={formatValue(data.profit)} color={returnColor} tooltip="The sum of total withdrawals and final value, minus the initial investment." /></Grid>
        </Grid>
        {chartData && (
           <ResponsiveContainer width="100%" height={350}>
             <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="date" tickFormatter={formatChartDate} />
               <YAxis tickFormatter={(val) => `₹${(val / 100000).toFixed(val > 99999 ? 1 : 2)}L`} />
               <Tooltip formatter={(value) => formatValue(value)} />
               <Legend />
               <Area type="monotone" name="Total Value" dataKey="value" stroke="#6a5acd" fill="#6a5acd" />
               <Area type="monotone" name="Amount After Withdrawal" dataKey="remainingPrincipal" stroke="#82ca9d" fill="#82ca9d" />
               <Area type="monotone" name="Profit" dataKey="profit" stroke="#db7093" fill="#db7093" />
             </AreaChart>
           </ResponsiveContainer>
        )}
      </Box>
    );
  }
  
  // --- Display Logic for Rolling Returns ---
  if (type === 'rolling') {
    return (
      <Box>
        <Grid container spacing={2} mb={4}>
          <Grid item xs={6} md={4}><StatCard title="Average Return" value={`${data.average.toFixed(2)}%`} color="primary.main" tooltip="The average of all calculated rolling periods." /></Grid>
          <Grid item xs={6} md={4}><StatCard title="Median Return" value={`${data.median.toFixed(2)}%`} color="secondary.main" tooltip="The middle return value. 50% of periods were higher, 50% were lower." /></Grid>
          <Grid item xs={12} md={4}><StatCard title="Volatility (Std Dev)" value={`${data.volatility.toFixed(2)}%`} color="warning.main" tooltip="Measures consistency. A lower number indicates more predictable returns." /></Grid>
          <Grid item xs={6} md={4}><StatCard title="Max Return" value={`${data.max.toFixed(2)}%`} color="success.main" tooltip="The best performance for any single rolling period."/></Grid>
          <Grid item xs={6} md={4}><StatCard title="Min Return" value={`${data.min.toFixed(2)}%`} color="error.main" tooltip="The worst performance for any single rolling period." /></Grid>
          <Grid item xs={12} md={4}><StatCard title="Observations" value={data.count.toLocaleString('en-IN')} tooltip="The number of rolling periods calculated."/></Grid>
        </Grid>
         <ResponsiveContainer width="100%" height={350}>
           <BarChart data={data.returnsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
             <CartesianGrid strokeDasharray="3 3" />
             <XAxis dataKey="date" tickFormatter={formatChartDate} />
             <YAxis label={{ value: 'Annualized Return (%)', angle: -90, position: 'insideLeft' }} />
             <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'CAGR']} />
             <Bar dataKey="cagr" name="Rolling Return" fill="#8884d8" />
           </BarChart>
         </ResponsiveContainer>
      </Box>
    );
  }

  return null;
}

