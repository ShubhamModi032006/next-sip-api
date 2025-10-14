'use client';

import { useWatchlist } from '@/context/WatchlistContext';
import { IconButton, Tooltip } from '@mui/material'; // We can still use MUI for simple things like icons
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';

export default function WatchlistButton({ schemeCode }) {
  const { isWatched, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const isBookmarked = isWatched(schemeCode);

  const handleClick = (e) => {
    e.stopPropagation(); // Prevents clicks from bubbling up to parent elements
    e.preventDefault();
    if (isBookmarked) {
      removeFromWatchlist(schemeCode);
    } else {
      addToWatchlist(schemeCode);
    }
  };

  return (
    <Tooltip title={isBookmarked ? "Remove from Watchlist" : "Add to Watchlist"}>
      <button
        onClick={handleClick}
        className="p-2 rounded-full hover:bg-yellow-100 transition-colors"
      >
        {isBookmarked ? (
          <StarRoundedIcon className="text-yellow-500" />
        ) : (
          <StarBorderRoundedIcon className="text-gray-400 hover:text-yellow-500" />
        )}
      </button>
    </Tooltip>
  );
}