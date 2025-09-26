'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';
import SIPCalculator from '../../components/SIPCalculator';
import LumpsumCalculator from '../../components/LumpsumCalculator';
import ComparisonTool from '../../components/ComparisonTool';
import SWPCalculator from '../../components/SWPCalculator';

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
  const [returns, setReturns] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (code) {
      fetchSchemeData();
      fetchReturns();
    }
  }, [code]);

  const fetchSchemeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/scheme/${code}`);
      setSchemeData(response.data);
      
      // Prepare chart data (last 1 year)
      const navData = response.data.data.slice(0, 365).reverse();
      const chartData = navData.map(item => ({
        date: dayjs(item.date).format('MMM DD'),
        nav: parseFloat(item.nav),
        fullDate: item.date
      }));
      setChartData(chartData);
    } catch (err) {
      setError('Failed to fetch scheme data');
      console.error('Error fetching scheme:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    try {
      const periods = ['1m', '3m', '6m', '1y'];
      const returnsData = {};
      
      for (const period of periods) {
        try {
          const response = await axios.get(`/api/scheme/${code}/returns?period=${period}`);
          returnsData[period] = response.data;
        } catch (err) {
          console.error(`Error fetching ${period} returns:`, err);
          returnsData[period] = { error: 'Data not available' };
        }
      }
      
      setReturns(returnsData);
    } catch (err) {
      console.error('Error fetching returns:', err);
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
      <Alert severity="error" sx={{ mt: 2 }}>
        {error || 'Scheme not found'}
      </Alert>
    );
  }

  const { meta, data } = schemeData;
  const latestNav = data && data.length > 0 ? data[0] : null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          Back to Funds
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          {meta.scheme_name}
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item>
            <Chip label={meta.fund_house} color="primary" variant="outlined" />
          </Grid>
          <Grid item>
            <Chip label={meta.scheme_category} color="secondary" variant="outlined" />
          </Grid>
          <Grid item>
            <Chip label={meta.scheme_type} color="default" variant="outlined" />
          </Grid>
        </Grid>

        {latestNav && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" color="primary">
              ₹{parseFloat(latestNav.nav).toFixed(4)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              NAV as on {dayjs(latestNav.date).format('DD MMM YYYY')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* NAV Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            NAV Performance (Last 1 Year)
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip 
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return dayjs(payload[0].payload.fullDate).format('DD MMM YYYY');
                    }
                    return label;
                  }}
                  formatter={(value) => [`₹${value.toFixed(4)}`, 'NAV']}
                />
                <Line 
                  type="monotone" 
                  dataKey="nav" 
                  stroke="#1976d2" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Historical Returns
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Simple Return (%)</TableCell>
                  <TableCell align="right">Annualized Return (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(returns).map(([period, data]) => (
                  <TableRow key={period}>
                    <TableCell>{period.toUpperCase()}</TableCell>
                    <TableCell align="right">
                      {data.error ? 'N/A' : `${data.simpleReturn?.toFixed(2)}%`}
                    </TableCell>
                    <TableCell align="right">
                      {data.error ? 'N/A' : data.annualizedReturn ? `${data.annualizedReturn.toFixed(2)}%` : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
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
              <Tab label="SIP vs Lumpsum" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <SIPCalculator schemeCode={code} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <LumpsumCalculator schemeCode={code} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <SWPCalculator schemeCode={code} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <ComparisonTool schemeCode={code} />
          </TabPanel>
        </CardContent>
      </Card>

      {/* Scheme Details */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Scheme Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Fund House</Typography>
              <Typography variant="body1">{meta.fund_house}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Scheme Code</Typography>
              <Typography variant="body1">{meta.scheme_code}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Category</Typography>
              <Typography variant="body1">{meta.scheme_category}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Type</Typography>
              <Typography variant="body1">{meta.scheme_type}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
