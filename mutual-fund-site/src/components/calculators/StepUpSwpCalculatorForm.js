'use client';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedWrapper } from '@/components/ui/animated-wrapper';
import { Calculator, Calendar, DollarSign, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react';

export default function StepUpSwpCalculatorForm({ state, onStateChange }) {
  return (
    <AnimatedWrapper animation="fadeInUp">
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Step-Up SWP Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Initial Investment</span>
            </label>
            <Input
              type="number"
              placeholder="Enter initial investment amount"
              value={state.initialInvestment}
              onChange={e => onStateChange('stepUpSwp', 'initialInvestment', Number(e.target.value))}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <TrendingDown className="h-4 w-4" />
              <span>Initial Monthly Withdrawal</span>
            </label>
            <Input
              type="number"
              placeholder="Enter initial monthly withdrawal"
              value={state.withdrawalAmount}
              onChange={e => onStateChange('stepUpSwp', 'withdrawalAmount', Number(e.target.value))}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Withdrawal Start Date</span>
            </label>
            <Input
              type="date"
              value={state.fromDate ? (typeof state.fromDate === 'string' ? state.fromDate : state.fromDate.format('YYYY-MM-DD')) : ''}
              onChange={e => onStateChange('stepUpSwp', 'fromDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <CalendarDays className="h-4 w-4" />
              <span>Withdrawal End Date</span>
            </label>
            <Input
              type="date"
              value={state.toDate ? (typeof state.toDate === 'string' ? state.toDate : state.toDate.format('YYYY-MM-DD')) : ''}
              onChange={e => onStateChange('stepUpSwp', 'toDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Annual Increase in Withdrawal: {state.annualIncrease}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={state.annualIncrease}
              onChange={e => onStateChange('stepUpSwp', 'annualIncrease', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1%</span>
              <span>20%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedWrapper>
  );
}
