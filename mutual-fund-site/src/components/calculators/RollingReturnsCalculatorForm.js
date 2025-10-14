'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedWrapper } from '@/components/ui/animated-wrapper';
import { Calculator, Calendar, BarChart3 } from 'lucide-react';

export default function RollingReturnsCalculatorForm({ state, onStateChange }) {
  return (
    <AnimatedWrapper animation="fadeInUp">
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Rolling Returns Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Return Period: <strong>{state.periodYears} Year(s)</strong></span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={state.periodYears}
              onChange={e => onStateChange('rolling', 'periodYears', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 Year</span>
              <span>10 Years</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedWrapper>
  );
}
