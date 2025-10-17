'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GitCompareArrows, ArrowUpRight, ArrowDownRight } from 'lucide-react';

import LumpsumCalculatorForm from '@/components/calculators/LumpsumCalculatorForm';
import SipCalculatorForm from '@/components/calculators/SipCalculatorForm';
import StepUpSipCalculatorForm from '@/components/calculators/StepUpSipCalculatorForm';
import SwpCalculatorForm from '@/components/calculators/SwpCalculatorForm';
import StepUpSwpCalculatorForm from '@/components/calculators/StepUpSwpCalculatorForm';
import RollingReturnsCalculatorForm from '@/components/calculators/RollingReturnsCalculatorForm';
import CalculationResult from '@/components/calculators/CalculationResult';
import { useCompare } from '@/context/CompareContext';

const TopStatCard = ({ title, value, positive }) => (
  <Card>
    <CardContent className="p-4 text-center">
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className={`text-xl font-semibold inline-flex items-center justify-center gap-1 ${positive == null ? '' : positive ? 'text-green-600' : 'text-red-600'}`}>
        {positive == null ? null : (positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />)}
        {value}
      </div>
    </CardContent>
  </Card>
);

export default function SchemeDetailPage() {
  const { code } = useParams();
  const { addToCompareAndNavigate } = useCompare();

  const [schemeData, setSchemeData] = useState(null);
  const [returnsData, setReturnsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('1y');
  const [activeTab, setActiveTab] = useState('sip');
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

  const handlePeriodChange = (newPeriod) => { if (newPeriod) setChartPeriod(newPeriod); };
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

  const handleInputChange = (calcType, field, value) => {
    const isDateField = field.toLowerCase().includes('date');
    const updatedValue = isDateField ? dayjs(value) : value;
    setCalcState(prev => ({ ...prev, [calcType]: { ...prev[calcType], [field]: updatedValue } }));
  };

  const handleCalculate = async () => {
    setCalcLoading(true);
    setCalcResult(null);
    setCalcError(null);
    let endpoint = activeTab;
    let body = {};
    const commonOptions = { frequency: 'monthly' };
    switch (activeTab) {
      case 'sip': endpoint = 'sip'; body = { ...calcState.sip, ...commonOptions, fromDate: calcState.sip.fromDate.format('YYYY-MM-DD'), toDate: calcState.sip.toDate.format('YYYY-MM-DD') }; break;
      case 'stepUpSip': endpoint = 'stepup-sip'; body = { ...calcState.stepUpSip, ...commonOptions, fromDate: calcState.stepUpSip.fromDate.format('YYYY-MM-DD'), toDate: calcState.stepUpSip.toDate.format('YYYY-MM-DD') }; break;
      case 'lumpsum': endpoint = 'lumpsum'; body = { ...calcState.lumpsum, fromDate: calcState.lumpsum.fromDate.format('YYYY-MM-DD'), toDate: calcState.lumpsum.toDate.format('YYYY-MM-DD') }; break;
      case 'swp': endpoint = 'swp'; body = { ...calcState.swp, ...commonOptions, fromDate: calcState.swp.fromDate.format('YYYY-MM-DD'), toDate: calcState.swp.toDate.format('YYYY-MM-DD') }; break;
      case 'stepUpSwp': endpoint = 'stepup-swp'; body = { ...calcState.stepUpSwp, ...commonOptions, fromDate: calcState.stepUpSwp.fromDate.format('YYYY-MM-DD'), toDate: calcState.stepUpSwp.toDate.format('YYYY-MM-DD') }; break;
      case 'rolling': endpoint = 'rolling'; body = { ...calcState.rolling, frequencyDays: 1 }; break;
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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (error) return <div className="container mx-auto px-4 py-6"><div className="text-red-600">{error}</div></div>;

  const formatStatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const formatChartDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{schemeData.meta.scheme_name}</h1>
        <p className="text-muted-foreground">{schemeData.meta.fund_house}</p>
        <Button variant="outline" className="mt-2" onClick={() => addToCompareAndNavigate({ schemeCode: schemeData.meta.scheme_code, schemeName: schemeData.meta.scheme_name })}>
          <GitCompareArrows className="h-4 w-4 mr-2" />
          Add to Compare
        </Button>
      </div>

      {selectedReturnData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TopStatCard title="Absolute Return" value={`${selectedReturnData.simpleReturn}%`} positive={isPositiveReturn} />
          {selectedReturnData.annualizedReturn && (
            <TopStatCard title="Annualized (CAGR)" value={`${selectedReturnData.annualizedReturn}%`} positive={isPositiveReturn} />
          )}
          <TopStatCard title={`Start NAV (${formatStatDate(selectedReturnData.startDate)})`} value={`₹${Number(selectedReturnData.startNav).toFixed(2)}`} />
          <TopStatCard title={`End NAV (${formatStatDate(selectedReturnData.endDate)})`} value={`₹${Number(selectedReturnData.endNav).toFixed(2)}`} />
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {['1m','6m','1y','3y','5y','10y','max'].map(p => (
              <Button key={p} variant={chartPeriod === p ? 'default' : 'outline'} size="sm" onClick={() => handlePeriodChange(p)}>
                {p.toUpperCase()}
              </Button>
            ))}
          </div>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getFilteredChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatChartDate} />
                <YAxis domain={['auto','auto']} tickFormatter={(tick) => `₹${tick.toFixed(0)}`} width={80} />
                <Tooltip formatter={(value) => [`₹${Number(value).toFixed(4)}`, 'NAV']} labelFormatter={(label) => formatStatDate(label)} />
                <Legend />
                <Line type="monotone" dataKey="nav" name="NAV" stroke="#1976d2" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold text-center mb-3">Investment Calculators</h2>
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                <TabsTrigger value="sip">SIP</TabsTrigger>
                <TabsTrigger value="stepUpSip">Step-Up SIP</TabsTrigger>
                <TabsTrigger value="lumpsum">Lumpsum</TabsTrigger>
                <TabsTrigger value="swp">SWP</TabsTrigger>
                <TabsTrigger value="stepUpSwp">Step-Up SWP</TabsTrigger>
                <TabsTrigger value="rolling">Rolling Returns</TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                <div>
                  <TabsContent value="sip"><SipCalculatorForm state={calcState.sip} onStateChange={handleInputChange} /></TabsContent>
                  <TabsContent value="stepUpSip"><StepUpSipCalculatorForm state={calcState.stepUpSip} onStateChange={handleInputChange} /></TabsContent>
                  <TabsContent value="lumpsum"><LumpsumCalculatorForm state={calcState.lumpsum} onStateChange={handleInputChange} /></TabsContent>
                  <TabsContent value="swp"><SwpCalculatorForm state={calcState.swp} onStateChange={handleInputChange} /></TabsContent>
                  <TabsContent value="stepUpSwp"><StepUpSwpCalculatorForm state={calcState.stepUpSwp} onStateChange={handleInputChange} /></TabsContent>
                  <TabsContent value="rolling"><RollingReturnsCalculatorForm state={calcState.rolling} onStateChange={handleInputChange} /></TabsContent>
                </div>
                <div>
                  <Button onClick={handleCalculate} disabled={calcLoading} className="w-full mb-4">
                    {calcLoading ? 'Calculating…' : 'Calculate Returns'}
                  </Button>
                  <CalculationResult result={calcResult} error={calcError} loading={calcLoading} />
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

