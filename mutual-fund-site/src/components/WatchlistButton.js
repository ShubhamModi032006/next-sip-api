'use client';

import { useWatchlist } from '@/context/WatchlistContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, StarOff } from 'lucide-react';
import { AnimatedWrapper } from '@/components/ui/animated-wrapper';

export default function WatchlistButton({ scheme }) {
  const { isWatched, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const isBookmarked = isWatched(scheme.schemeCode);

  const handleClick = (e) => {
    e.stopPropagation(); // Prevents clicks from bubbling up to parent elements
    e.preventDefault();
    if (isBookmarked) {
      removeFromWatchlist(scheme.schemeCode);
    } else {
      addToWatchlist(scheme);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <AnimatedWrapper animation="scaleIn">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClick}
              className={`p-2 rounded-full transition-all duration-200 hover-scale ${
                isBookmarked 
                  ? 'text-yellow-500 hover:bg-yellow-50' 
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
              }`}
            >
              {isBookmarked ? (
                <Star className="h-5 w-5 fill-current" />
              ) : (
                <StarOff className="h-5 w-5" />
              )}
            </Button>
          </AnimatedWrapper>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isBookmarked ? "Remove from Watchlist" : "Add to Watchlist"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}