'use client';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedWrapper } from '@/components/ui/animated-wrapper';
import { Calculator, Calendar, DollarSign, CalendarDays, TrendingDown } from 'lucide-react';

/**
 * A controlled form component for the SWP Calculator.
 * It receives its state and a function to update the state from its parent component.
 * This makes it a "dumb" component, focused purely on UI.
 * @param {object} props - The component props.
 * @param {object} props.state - The current state of the form inputs.
 * @param {Function} props.onStateChange - The function to call when an input value changes.
 */
export default function SwpCalculatorForm({ state, onStateChange }) {
  return (
    <AnimatedWrapper animation="fadeInUp">
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>SWP Calculator</span>
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
              onChange={e => onStateChange('swp', 'initialInvestment', Number(e.target.value))}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <TrendingDown className="h-4 w-4" />
              <span>Monthly Withdrawal</span>
            </label>
            <Input
              type="number"
              placeholder="Enter monthly withdrawal amount"
              value={state.withdrawalAmount}
              onChange={e => onStateChange('swp', 'withdrawalAmount', Number(e.target.value))}
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
              value={state.fromDate ? state.fromDate.format('YYYY-MM-DD') : ''}
              onChange={e => onStateChange('swp', 'fromDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <CalendarDays className="h-4 w-4" />
              <span>Withdrawal End Date</span>
            </label>
            <Input
              type="date"
              value={state.toDate ? state.toDate.format('YYYY-MM-DD') : ''}
              onChange={e => onStateChange('swp', 'toDate', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </AnimatedWrapper>
  );
}

