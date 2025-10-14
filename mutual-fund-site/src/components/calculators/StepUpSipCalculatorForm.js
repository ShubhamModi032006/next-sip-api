'use client';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedWrapper } from '@/components/ui/animated-wrapper';
import { Calculator, Calendar, DollarSign, CalendarDays, TrendingUp, Percent } from 'lucide-react';

export default function StepUpSipCalculatorForm({ state, onStateChange }) {
  return (
    <AnimatedWrapper animation="fadeInUp">
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Step-Up SIP Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Initial Monthly Investment</span>
            </label>
            <Input
              type="number"
              placeholder="Enter initial monthly investment"
              value={state.amount}
              onChange={e => onStateChange('stepUpSip', 'amount', Number(e.target.value))}
              className="text-lg"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Start Date</span>
            </label>
            <Input
              type="date"
              value={state.fromDate ? state.fromDate.format('YYYY-MM-DD') : ''}
              onChange={e => onStateChange('stepUpSip', 'fromDate', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <CalendarDays className="h-4 w-4" />
              <span>End Date</span>
            </label>
            <Input
              type="date"
              value={state.toDate ? state.toDate.format('YYYY-MM-DD') : ''}
              onChange={e => onStateChange('stepUpSip', 'toDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Annual Increase: {state.annualIncrease}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={state.annualIncrease}
              onChange={e => onStateChange('stepUpSip', 'annualIncrease', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1%</span>
              <span>30%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedWrapper>
  );
}
