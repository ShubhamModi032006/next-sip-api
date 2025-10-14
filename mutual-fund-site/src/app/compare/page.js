'use client';

import { React, useState, useEffect } from 'react';
import { useCompare } from '@/context/CompareContext';
import {
  Container, Typography, Box, Paper, Grid, CircularProgress, Alert,
  Chip, Autocomplete, TextField, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, useTheme
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Use the theme's palette for colors to ensure consistency
const COLORS = (theme) => [
  theme.palette.primary.main,
  theme.palette.success.main,
  theme.palette.warning.main,
  theme.palette.error.main,
];

// Main component for the compare page
export default function ComparePage() {
  const { compareList, addToCompare, removeFromCompare } = useCompare();
  const theme = useTheme();
  const chartColors = COLORS(theme);

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [chartData, setChartData] = useState([]);
  
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  // Effect for handling the autocomplete search
  useEffect(() => {
    if (searchValue.length < 3) {
      setSearchOptions([]);
      return;
    }
    const handler = setTimeout(() => {
      fetch(`/api/mf?q=${searchValue}&limit=10`)
        .then(res => res.json())
        .then(data => setSearchOptions(data.schemes || []));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchValue]);

  // Main data fetching and processing effect
  useEffect(() => {
    if (compareList.length === 0) {
      setCompareData(null);
      setChartData([]);
      return;
    }

    setLoading(true);
    setError(null);
    const schemeCodes = compareList.map(f => f.schemeCode);

    fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemeCodes }),
    })
    .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch comparison data'))
    .then(data => {
      setCompareData(data);

      // Transform data for the Recharts graph
      const allDates = new Set();
      Object.values(data).forEach(fundDetails => {
        fundDetails.navHistory.forEach(point => allDates.add(point.date));
      });
      const sortedDates = Array.from(allDates).sort();

      const newChartData = sortedDates.map(date => {
        const dataPoint = { date };
        compareList.forEach(fund => {
          const fundHistory = data[fund.schemeCode]?.navHistory;
          if (fundHistory) {
            const navPoint = fundHistory.find(p => p.date === date);
            const firstNav = fundHistory[0]?.nav;
            if (navPoint && firstNav) {
              dataPoint[fund.schemeName] = (navPoint.nav / firstNav) * 100;
            }
          }
        });
        return dataPoint;
      });
      setChartData(newChartData);
    })
    .catch(err => {
      setError(err.message);
    })
    .finally(() => {
        setLoading(false);
    });
  }, [compareList]);
  
  return (
    // UPDATED: Container is now full-width with internal padding for a modern look
    <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, sm: 4 }, py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Compare Funds
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Analyze fund performance side-by-side
        </Typography>
      </Box>
      
      {/* Search and Add Section */}
      <Paper elevation={3} sx={{ p: 2, mb: 4, position: 'sticky', top: '80px', zIndex: 10, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
        <Autocomplete
          options={searchOptions}
          getOptionLabel={(option) => option.schemeName}
          isOptionEqualToValue={(option, value) => option.schemeCode === value.schemeCode}
          onInputChange={(_, newInputValue) => setSearchValue(newInputValue)}
          onChange={(_, newValue) => {
            if (newValue) {
              addToCompare({ schemeCode: newValue.schemeCode, schemeName: newValue.schemeName });
            }
          }}
          renderInput={(params) => <TextField {...params} label="Search and add a fund to compare (up to 4)..." />}
          noOptionsText={searchValue.length < 3 ? "Type at least 3 characters" : "No funds found"}
        />
      </Paper>

      {compareList.length === 0 && !loading ? (
        <Alert severity="info" sx={{ mt: 4 }}>Add funds to start your comparison.</Alert>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {compareList.map((fund, index) => (
                <Chip
                  key={fund.schemeCode}
                  label={fund.schemeName}
                  onDelete={() => removeFromCompare(fund.schemeCode)}
                  sx={{ 
                    backgroundColor: chartColors[index % chartColors.length], 
                    color: 'white', fontWeight: 'bold', fontSize: '0.875rem',
                    '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white'} },
                  }}
                />
              ))}
            </Stack>
          </Grid>

          {loading ? <Grid item xs={12} sx={{display: 'flex', justifyContent: 'center', py: 8}}><CircularProgress /></Grid> : error ? <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid> : compareData && (
            <>
              {/* --- Key Information Table --- */}
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom fontWeight="medium">Key Information</Typography>
                <TableContainer component={Paper} elevation={3}>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Metric</TableCell>
                        {compareList.map((fund, index) => (
                          <TableCell key={fund.schemeCode} align="right" sx={{ fontWeight: 'bold', color: chartColors[index % chartColors.length], fontSize: '1rem' }}>{fund.schemeName}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* AESTHETIC: Zebra striping and hover effect for better readability */}
                      {['Fund House', 'Category', 'Type'].map((metric, rowIndex) => (
                        <TableRow key={metric} sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover }, transition: 'background-color 0.2s', '&:hover': { backgroundColor: theme.palette.action.selected } }}>
                          <TableCell>{metric}</TableCell>
                          {compareList.map(f => <TableCell key={f.schemeCode} align="right">{compareData[f.schemeCode]?.meta[metric.toLowerCase().replace(' ', '_')]}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* --- Returns Comparison Table --- */}
              <Grid item xs={12}>
                 <Typography variant="h5" gutterBottom fontWeight="medium">Returns Comparison</Typography>
                <TableContainer component={Paper} elevation={3}>
                  <Table sx={{ minWidth: 650 }}>
                     <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Period</TableCell>
                        {compareList.map((fund, index) => (
                          <TableCell key={fund.schemeCode} align="right" sx={{ fontWeight: 'bold', color: chartColors[index % chartColors.length], fontSize: '1rem' }}>{fund.schemeName}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {['1m', '6m', '1y', '3y', '5y', '10y'].map(period => (
                        <TableRow key={period} sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover }, transition: 'background-color 0.2s', '&:hover': { backgroundColor: theme.palette.action.selected } }}>
                          <TableCell sx={{ fontWeight: 'medium' }}>{period.toUpperCase()}</TableCell>
                          {compareList.map(fund => {
                            const returns = compareData[fund.schemeCode]?.returns.find(r => r.period === period);
                            const displayValue = returns?.annualizedReturn ? `${returns.annualizedReturn}% (CAGR)` : returns?.simpleReturn ? `${returns.simpleReturn}%` : 'N/A';
                            const isPositive = parseFloat(returns?.simpleReturn) >= 0;
                            return (
                              <TableCell key={fund.schemeCode} align="right" sx={{ fontWeight: 'medium', color: returns ? (isPositive ? 'success.main' : 'error.main') : 'text.secondary' }}>
                                {displayValue}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* --- Performance Growth Chart --- */}
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom fontWeight="medium">Performance Growth</Typography>
                <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>Growth of ₹100 invested at the earliest common date.</Typography>
                <Paper elevation={3} sx={{ height: 450, width: 1320, p: {xs: 1, sm: 3} }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', {year: 'numeric', month: 'short'})} />
                      <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      {compareList.map((fund, index) => (
                        <Line key={fund.schemeCode} type="monotone" dataKey={fund.schemeName} stroke={chartColors[index % chartColors.length]} strokeWidth={2.5} dot={false}/>
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>
      )}
    </Container>
  );
}

