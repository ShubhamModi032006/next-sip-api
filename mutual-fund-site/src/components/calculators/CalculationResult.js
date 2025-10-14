'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AnimatedWrapper, StaggerContainer, StaggerItem } from '@/components/ui/animated-wrapper';
import { AreaChart, BarChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Bar } from 'recharts';
import StatCard from './StatCard';
import { AlertCircle, BarChart3 } from 'lucide-react';

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
      <AnimatedWrapper animation="fadeIn">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </AnimatedWrapper>
    );
  }

  // 2. Handle error state
  if (error) {
    return (
      <AnimatedWrapper animation="fadeInUp">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-2 py-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-600">Error: {error}</span>
          </CardContent>
        </Card>
      </AnimatedWrapper>
    );
  }

  // 3. Handle initial/empty state
  if (!result) {
    return (
      <AnimatedWrapper animation="fadeInUp">
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Calculate</h3>
            <p className="text-muted-foreground">
              Enter your investment details and click "Calculate" to see your personalized projection.
            </p>
          </CardContent>
        </Card>
      </AnimatedWrapper>
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
      <div className="space-y-6">
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StaggerItem>
            <StatCard title="Amount Invested" value={formatValue(data.totalInvested)} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Final Value" value={formatValue(data.finalValue)} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Profit" value={formatValue(data.profit)} color={returnColor} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Absolute Return" value={`${data.absoluteReturn.toFixed(2)}%`} color={returnColor} />
          </StaggerItem>
          <StaggerItem>
            <StatCard 
              title="Annualized (CAGR)" 
              value={data.annualizedReturn ? `${data.annualizedReturn.toFixed(2)}%` : 'N/A'} 
              subValue={!data.annualizedReturn ? '(for >1Y)' : null} 
              color={returnColor} 
              tooltip="Compounded Annual Growth Rate shows the average yearly growth of your investment." 
            />
          </StaggerItem>
        </StaggerContainer>
        {chartData && (
          <AnimatedWrapper animation="fadeInUp" delay={0.2}>
            <Card>
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          </AnimatedWrapper>
        )}
      </div>
    );
  }

  // --- Display Logic for SWP and Step-Up SWP ---
  if (['swp', 'stepup-swp'].includes(type)) {
    // Build chart data for SWP variants
    const chartData = data.portfolioGrowth ?? null;
    const isPositive = data.profit >= 0;
    const returnColor = isPositive ? 'success.main' : 'error.main';
    return (
      <div className="space-y-6">
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard title="Initial Investment" value={formatValue(data.initialInvestment)} />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Total Withdrawn" value={formatValue(data.totalWithdrawn)} tooltip="The total amount you received from all withdrawals." />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Final Value" value={formatValue(data.finalValue)} tooltip="The value of your remaining investment at the end of the period." />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Total Profit" value={formatValue(data.profit)} color={returnColor} tooltip="The sum of total withdrawals and final value, minus the initial investment." />
          </StaggerItem>
        </StaggerContainer>
        {chartData && (
          <AnimatedWrapper animation="fadeInUp" delay={0.2}>
            <Card>
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          </AnimatedWrapper>
        )}
      </div>
    );
  }
  
  // --- Display Logic for Rolling Returns ---
  if (type === 'rolling') {
    return (
      <div className="space-y-6">
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StaggerItem>
            <StatCard title="Average Return" value={`${data.average.toFixed(2)}%`} color="primary" tooltip="The average of all calculated rolling periods." />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Median Return" value={`${data.median.toFixed(2)}%`} color="secondary" tooltip="The middle return value. 50% of periods were higher, 50% were lower." />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Volatility (Std Dev)" value={`${data.volatility.toFixed(2)}%`} color="warning" tooltip="Measures consistency. A lower number indicates more predictable returns." />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Max Return" value={`${data.max.toFixed(2)}%`} color="success" tooltip="The best performance for any single rolling period." />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Min Return" value={`${data.min.toFixed(2)}%`} color="error" tooltip="The worst performance for any single rolling period." />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Observations" value={data.count.toLocaleString('en-IN')} tooltip="The number of rolling periods calculated." />
          </StaggerItem>
        </StaggerContainer>
        <AnimatedWrapper animation="fadeInUp" delay={0.2}>
          <Card>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.returnsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatChartDate} />
                  <YAxis label={{ value: 'Annualized Return (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'CAGR']} />
                  <Bar dataKey="cagr" name="Rolling Return" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>
    );
  }

  return null;
}

