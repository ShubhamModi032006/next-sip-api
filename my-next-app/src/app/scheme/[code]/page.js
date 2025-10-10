'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography, Grid, Card, CardContent, Box, CircularProgress, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Tabs, Tab, Divider, ButtonGroup, Skeleton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import SIPCalculator from '../../components/SIPCalculator';
import LumpsumCalculator from '../../components/LumpsumCalculator';
import ComparisonTool from '../../components/ComparisonTool';
import SWPCalculator from '../../components/SWPCalculator';
import StepUpSIPCalculator from '../../components/StepUpSIPCalculator';
import StepUpSWPCalculator from '../../components/StepUpSWPCalculator';
import RollingReturns from '../../components/RollingReturns';
import AlphaBeta from '../../components/AlphaBeta';

dayjs.extend(isSameOrAfter);

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SchemeDetail() {
  const params = useParams();
  const router = useRouter();
  const { code } = params;

  const [schemeData, setSchemeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const [fullNavData, setFullNavData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('1Y');

  const [periodReturn, setPeriodReturn] = useState(null);
  const [isReturnLoading, setIsReturnLoading] = useState(true);

  useEffect(() => {
    if (code) {
      fetchSchemeData();
    }
  }, [code]);

  useEffect(() => {
    if (fullNavData.length > 0) {
      handlePeriodChange(chartPeriod);
    }
  }, [fullNavData]);


  const fetchSchemeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/scheme/${encodeURIComponent(code)}`);
      setSchemeData(response.data);
      setFullNavData(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch scheme data');
      console.error('Error fetching scheme:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = async (period) => {
    setChartPeriod(period);

    let startDate;
    const now = dayjs();

    switch (period) {
      case '1M': startDate = now.subtract(1, 'month'); break;
      case '6M': startDate = now.subtract(6, 'months'); break;
      case '5Y': startDate = now.subtract(5, 'years'); break;
      case '10Y': startDate = now.subtract(10, 'years'); break;
      case '1Y': default: startDate = now.subtract(1, 'year'); break;
    }

    const filteredData = fullNavData.filter(item => {
      const itemDate = dayjs(item.date, 'DD-MM-YYYY');
      return itemDate.isSameOrAfter(startDate);
    });

    const processedChartData = filteredData.map(item => ({
      date: dayjs(item.date, 'DD-MM-YYYY').format('MMM DD, YYYY'),
      nav: parseFloat(item.nav),
    })).reverse();
    setChartData(processedChartData);

    try {
      setIsReturnLoading(true);
      const apiPeriod = period.toLowerCase();
      const response = await axios.get(
        `/api/scheme/${encodeURIComponent(code)}/returns?period=${encodeURIComponent(apiPeriod)}`
      );
      setPeriodReturn(response.data);
    } catch (err) {
      console.error(`Error fetching ${period} return:`, err);
      setPeriodReturn({
        error: 'Data not available for this period',
        details: err.response?.data?.error || err.message
      });
    } finally {
      setIsReturnLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !schemeData) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>{error || 'Scheme not found'}</Alert>
    );
  }

  const { meta, data } = schemeData;
  const latestNav = data && data.length > 0 ? data[0] : null;
  const periodMap = {
    '1M': '1 Month', '6M': '6 Months', '1Y': '1 Year',
    '5Y': '5 Years', '10Y': '10 Years',
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mb: 2 }}>
          Back to Funds
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>{meta.scheme_name}</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item><Chip label={meta.fund_house} color="primary" variant="outlined" /></Grid>
          <Grid item><Chip label={meta.scheme_category} color="secondary" variant="outlined" /></Grid>
          <Grid item><Chip label={meta.scheme_type} color="default" variant="outlined" /></Grid>
        </Grid>
        {latestNav && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" color="primary">₹{parseFloat(latestNav.nav).toFixed(4)}</Typography>
            <Typography variant="body2" color="text.secondary">
              NAV as on {dayjs(latestNav.date, 'DD-MM-YYYY').format('DD MMM YYYY')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* NAV Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">NAV Performance (Last {periodMap[chartPeriod]})</Typography>
            <ButtonGroup variant="outlined" size="small">
              {['1M', '6M', '1Y', '5Y', '10Y'].map((period) => (
                <Button key={period} onClick={() => handlePeriodChange(period)} variant={chartPeriod === period ? 'contained' : 'outlined'}>
                  {period}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} allowDataOverflow={true} width={80} />
                <Tooltip
                  labelFormatter={(label) => dayjs(label).format('DD MMM YYYY')}
                  formatter={(value) => [`₹${value.toFixed(4)}`, 'NAV']}
                />
                <Line type="monotone" dataKey="nav" stroke="#1976d2" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Historical Returns</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Absolute Return (%)</TableCell>
                  <TableCell align="right">Annualized (CAGR)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isReturnLoading ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Skeleton animation="wave" />
                    </TableCell>
                  </TableRow>
                ) : periodReturn ? (
                  <TableRow>
                    <TableCell>{periodMap[chartPeriod]}</TableCell>
                    <TableCell align="right">
                      {periodReturn.error ? `Error` : `${periodReturn.absoluteReturn?.toFixed(2)}%`}
                    </TableCell>
                    <TableCell align="right" sx={{ color: periodReturn.error ? 'red' : 'inherit' }}>
                      {periodReturn.error
                        ? periodReturn.details
                        : periodReturn.annualizedReturn !== null
                          ? `${periodReturn.annualizedReturn.toFixed(2)}%`
                          : 'N/A (period < 1Y)'
                      }
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Calculators */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab label="SIP Calculator" />
              <Tab label="Lumpsum Calculator" />
              <Tab label="SWP Calculator" />
              <Tab label="Step-up SIP" />
              <Tab label="Step-up SWP" />
              <Tab label="Rolling Returns" />
              <Tab label="Alpha & Beta" />
              <Tab label="Comparison" />
            </Tabs>
          </Box>
          <TabPanel value={tabValue} index={0}><SIPCalculator schemeCode={code} /></TabPanel>
          <TabPanel value={tabValue} index={1}><LumpsumCalculator schemeCode={code} /></TabPanel>
          <TabPanel value={tabValue} index={2}><SWPCalculator schemeCode={code} /></TabPanel>
          <TabPanel value={tabValue} index={3}><StepUpSIPCalculator schemeCode={code} /></TabPanel>
          <TabPanel value={tabValue} index={4}><StepUpSWPCalculator schemeCode={code} /></TabPanel>
          <TabPanel value={tabValue} index={5}><RollingReturns schemeCode={code} /></TabPanel>
          <TabPanel value={tabValue} index={6}><AlphaBeta schemeCode={code} /></TabPanel>
          <TabPanel value={tabValue} index={7}><ComparisonTool schemeCode={code} /></TabPanel>
        </CardContent>
      </Card>

      {/* Scheme Details */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Scheme Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary">Fund House</Typography><Typography variant="body1">{meta.fund_house}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary">Scheme Code</Typography><Typography variant="body1">{meta.scheme_code}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary">Category</Typography><Typography variant="body1">{meta.scheme_category}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary">Type</Typography><Typography variant="body1">{meta.scheme_type}</Typography></Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}