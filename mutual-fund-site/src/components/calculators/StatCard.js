'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedWrapper, HoverCard } from '@/components/ui/animated-wrapper';
import { Info } from 'lucide-react';

export default function StatCard({ title, value, color = 'text-primary', subValue = null, tooltip = null }) {
  const getColorClass = (color) => {
    switch (color) {
      case 'success.main':
        return 'text-green-600';
      case 'error.main':
        return 'text-red-600';
      case 'warning.main':
        return 'text-yellow-600';
      default:
        return 'text-primary';
    }
  };

  return (
    <AnimatedWrapper animation="fadeInUp">
      <HoverCard className="h-full">
        <Card className="h-full hover-lift border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4 min-h-[48px]">
              <span className="text-sm text-muted-foreground font-medium">
                {title}
              </span>
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className={`text-2xl font-semibold ${getColorClass(color)} mb-2`}>
              {value}
            </div>
            {subValue && (
              <div className="text-sm text-muted-foreground">
                {subValue}
              </div>
            )}
          </CardContent>
        </Card>
      </HoverCard>
    </AnimatedWrapper>
  );
}
