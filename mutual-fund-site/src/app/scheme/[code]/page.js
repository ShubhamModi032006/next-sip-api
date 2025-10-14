'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Container, Typography, CircularProgress, Box, Paper, Alert, Grid,
  ToggleButtonGroup, ToggleButton, Stack, Tabs, Tab, Button,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

// --- Import ALL our modular components ---
import LumpsumCalculatorForm from '@/components/calculators/LumpsumCalculatorForm';
import SipCalculatorForm from '@/components/calculators/SipCalculatorForm';
import StepUpSipCalculatorForm from '@/components/calculators/StepUpSipCalculatorForm';
import SwpCalculatorForm from '@/components/calculators/SwpCalculatorForm';
import StepUpSwpCalculatorForm from '@/components/calculators/StepUpSwpCalculatorForm';
import RollingReturnsCalculatorForm from '@/components/calculators/RollingReturnsCalculatorForm';
import CalculationResult from '@/components/calculators/CalculationResult';

// --- NEW: Import the context hook and the icon for the compare button ---
import { useCompare } from '@/context/CompareContext';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';


// Reusable StatCard component for the top section
const TopStatCard = ({ title, value, color = 'text.primary', icon = null }) => (
  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
    <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
      {icon}
      <Typography variant="h5" component="p" color={color} sx={{ fontWeight: 'medium' }}>{value}</Typography>
    </Stack>
  </Paper>
);

export default function SchemeDetailPage() {
  const { code } = useParams();
  // Get the function to add a fund and navigate from our global context
  const { addToCompareAndNavigate } = useCompare();
  
  // All your existing state and functions remain here...
  const [schemeData, setSchemeData] = useState(null);
  const [returnsData, setReturnsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('1y');
  const [activeTab, setActiveTab] = useState(0);
  const [calcState, setCalcState] = useState({
    lumpsum: { amount: 100000, fromDate: dayjs().subtract(5, 'year'), toDate: dayjs() },
    sip: { amount: 5000, fromDate: dayjs().subtract(5, 'year'), toDate: dayjs() },
    stepUpSip: { amount: 5000, fromDate: dayjs().subtract(5, 'year'), toDate: dayjs(), annualIncrease: 10 },
    swp: { initialInvestment: 1000000, withdrawalAmount: 8000, fromDate: dayjs().subtract(5, 'year'), toDate: dayjs() },
    stepUpSwp: { initialInvestment: 1000000, withdrawalAmount: 8000, fromDate: dayjs().subtract(5, 'year'), toDate: dayjs(), annualIncrease: 5 },
    rolling: { periodYears: 3 },
  });
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState(null);
  
  useEffect(() => {
    if (!code) return;
    setLoading(true);
    const fetchInitialData = async () => {
      try {
        const schemeRes = await fetch(`/api/scheme/${code}`);
        if (!schemeRes.ok) throw new Error('Scheme not found');
        const schemeApiData = await schemeRes.json();
        setSchemeData(schemeApiData);

        const periods = ['1m', '6m', '1y', '3y', '5y', '10y'];
        const returnsPromises = periods.map(p => fetch(`/api/scheme/${code}/returns?period=${p}`).then(res => res.ok ? res.json() : null));
        const returnsResults = (await Promise.all(returnsPromises)).filter(Boolean);
        setReturnsData(returnsResults);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [code]);

  const handlePeriodChange = (_, newPeriod) => { if (newPeriod !== null) setChartPeriod(newPeriod); };
  const getFilteredChartData = () => {
      if (!schemeData?.navHistory) return [];
      const endDate = new Date(schemeData.summary.latestNav.date);
      const startDate = new Date(endDate);
      switch (chartPeriod) {
        case '1m': startDate.setMonth(endDate.getMonth() - 1); break;
        case '6m': startDate.setMonth(endDate.getMonth() - 6); break;
        case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
        case '3y': startDate.setFullYear(endDate.getFullYear() - 3); break;
        case '5y': startDate.setFullYear(endDate.getFullYear() - 5); break;
        case '10y': startDate.setFullYear(endDate.getFullYear() - 10); break;
        case 'max': return schemeData.navHistory;
        default: return schemeData.navHistory;
      }
      return schemeData.navHistory.filter(nav => new Date(nav.date) >= startDate);
  };
  const selectedReturnData = returnsData.find(r => r.period === chartPeriod);
  const isPositiveReturn = selectedReturnData && parseFloat(selectedReturnData.simpleReturn) >= 0;

  const handleTabChange = (_, newValue) => { setActiveTab(newValue); setCalcResult(null); setCalcError(null); };
  const handleInputChange = (calcType, field, value) => { setCalcState(prev => ({ ...prev, [calcType]: { ...prev[calcType], [field]: value } })); };

  const handleCalculate = async () => {
    setCalcLoading(true);
    setCalcResult(null);
    setCalcError(null);
    let endpoint = '';
    let body = {};
    const commonOptions = { frequency: 'monthly' };
    switch (activeTab) {
      case 0: endpoint = 'sip'; body = { ...calcState.sip, ...commonOptions, fromDate: calcState.sip.fromDate.format('YYYY-MM-DD'), toDate: calcState.sip.toDate.format('YYYY-MM-DD') }; break;
      case 1: endpoint = 'stepup-sip'; body = { ...calcState.stepUpSip, ...commonOptions, fromDate: calcState.stepUpSip.fromDate.format('YYYY-MM-DD'), toDate: calcState.stepUpSip.toDate.format('YYYY-MM-DD') }; break;
      case 2: endpoint = 'lumpsum'; body = { ...calcState.lumpsum, fromDate: calcState.lumpsum.fromDate.format('YYYY-MM-DD'), toDate: calcState.lumpsum.toDate.format('YYYY-MM-DD') }; break;
      case 3: endpoint = 'swp'; body = { ...calcState.swp, ...commonOptions, fromDate: calcState.swp.fromDate.format('YYYY-MM-DD'), toDate: calcState.swp.toDate.format('YYYY-MM-DD') }; break;
      case 4: endpoint = 'stepup-swp'; body = { ...calcState.stepUpSwp, ...commonOptions, fromDate: calcState.stepUpSwp.fromDate.format('YYYY-MM-DD'), toDate: calcState.stepUpSwp.toDate.format('YYYY-MM-DD') }; break;
      case 5: endpoint = 'rolling'; body = { ...calcState.rolling, frequencyDays: 1 }; break;
    }
    try {
      const res = await fetch(`/api/scheme/${code}/calculate/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Calculation failed');
      setCalcResult({ type: endpoint, data });
    } catch (err) {
      setCalcError(err.message);
    } finally {
      setCalcLoading(false);
    }
  };

  const renderActiveForm = () => {
    switch(activeTab) {
      case 0: return <SipCalculatorForm state={calcState.sip} onStateChange={handleInputChange} />;
      case 1: return <StepUpSipCalculatorForm state={calcState.stepUpSip} onStateChange={handleInputChange} />;
      case 2: return <LumpsumCalculatorForm state={calcState.lumpsum} onStateChange={handleInputChange} />;
      case 3: return <SwpCalculatorForm state={calcState.swp} onStateChange={handleInputChange} />;
      case 4: return <StepUpSwpCalculatorForm state={calcState.stepUpSwp} onStateChange={handleInputChange} />;
      case 5: return <RollingReturnsCalculatorForm state={calcState.rolling} onStateChange={handleInputChange} />;
      default: return null;
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const formatStatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const formatChartDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* --- SECTION 1: HEADER (Edited) --- */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1">{schemeData.meta.scheme_name}</Typography>
          <Typography variant="h5" color="text.secondary">{schemeData.meta.fund_house}</Typography>
          
          {/* --- THE NEW BUTTON IS ADDED HERE --- */}
          <Button
            variant="outlined"
            startIcon={<CompareArrowsIcon />}
            sx={{ mt: 2 }}
            onClick={() => addToCompareAndNavigate({ 
                schemeCode: schemeData.meta.scheme_code, 
                schemeName: schemeData.meta.scheme_name 
            })}
          >
            Add to Compare
          </Button>
        </Box>

        {/* --- SECTION 2: DYNAMIC STATS & NAV CHART (Unchanged) --- */}
        {selectedReturnData && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}><TopStatCard title="Absolute Return" value={`${selectedReturnData.simpleReturn}%`} color={isPositiveReturn ? 'success.main' : 'error.main'} icon={isPositiveReturn ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}/></Grid>
            {selectedReturnData.annualizedReturn && (<Grid item xs={12} sm={6} md={3}><TopStatCard title="Annualized (CAGR)" value={`${selectedReturnData.annualizedReturn}%`} color={isPositiveReturn ? 'success.main' : 'error.main'} /></Grid>)}
            <Grid item xs={12} sm={6} md={3}><TopStatCard title={`Start NAV (${formatStatDate(selectedReturnData.startDate)})`} value={`₹${Number(selectedReturnData.startNav).toFixed(2)}`} /></Grid>
            <Grid item xs={12} sm={6} md={3}><TopStatCard title={`End NAV (${formatStatDate(selectedReturnData.endDate)})`} value={`₹${Number(selectedReturnData.endNav).toFixed(2)}`} /></Grid>
          </Grid>
        )}
        <Paper elevation={3} sx={{ p: { xs: 1, sm: 3 }, mb: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ToggleButtonGroup value={chartPeriod} exclusive onChange={handlePeriodChange} size="small">
                    <ToggleButton value="1m">1M</ToggleButton><ToggleButton value="6m">6M</ToggleButton><ToggleButton value="1y">1Y</ToggleButton><ToggleButton value="3y">3Y</ToggleButton><ToggleButton value="5y">5Y</ToggleButton><ToggleButton value="10y">10Y</ToggleButton><ToggleButton value="max">Max</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Box sx={{ height: 450 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getFilteredChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={formatChartDate} /><YAxis domain={['auto', 'auto']} tickFormatter={(tick) => `₹${tick.toFixed(0)}`} width={80} /><Tooltip formatter={(value) => [`₹${value.toFixed(4)}`, 'NAV']} labelFormatter={(label) => formatStatDate(label)} /><Legend /><Line type="monotone" dataKey="nav" name="NAV" stroke="#1976d2" strokeWidth={2.5} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
        
        {/* --- SECTION 3: INTERACTIVE CALCULATORS (Unchanged) --- */}
        <Typography variant="h4" component="h2" textAlign="center" sx={{ mb: 3 }}>Investment Calculators</Typography>
        <Paper elevation={3}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Calculator Tabs">
            <Tab label="SIP" /><Tab label="Step-Up SIP" /><Tab label="Lumpsum" /><Tab label="SWP" /><Tab label="Step-Up SWP" /><Tab label="Rolling Returns" />
          </Tabs>
          <Box p={{ xs: 2, sm: 4 }}>
            <Grid container spacing={5} alignItems="flex-start">
              <Grid item xs={12} md={4}>
                {renderActiveForm()}
                <Button variant="contained" size="large" onClick={handleCalculate} disabled={calcLoading} sx={{ mt: 3, width: '100%' }}>
                  {calcLoading ? <CircularProgress size={24} color="inherit" /> : 'Calculate Returns'}
                </Button>
              </Grid>
              <Grid item xs={12} md={8}>
                <CalculationResult result={calcResult} error={calcError} loading={calcLoading} />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
}

