'use client';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedWrapper } from '@/components/ui/animated-wrapper';
import { Calculator, Calendar, DollarSign } from 'lucide-react';

export default function LumpsumCalculatorForm({ state, onStateChange }) {
  return (
    <AnimatedWrapper animation="fadeInUp">
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Lumpsum Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Total Investment</span>
            </label>
            <Input
              type="number"
              placeholder="Enter investment amount"
              value={state.amount}
              onChange={e => onStateChange('lumpsum', 'amount', Number(e.target.value))}
              className="text-lg"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Investment Date</span>
            </label>
            <Input
              type="date"
              value={state.fromDate ? state.fromDate.format('YYYY-MM-DD') : ''}
              onChange={e => onStateChange('lumpsum', 'fromDate', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Redemption Date</span>
            </label>
            <Input
              type="date"
              value={state.toDate ? state.toDate.format('YYYY-MM-DD') : ''}
              onChange={e => onStateChange('lumpsum', 'toDate', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </AnimatedWrapper>
  );
}
