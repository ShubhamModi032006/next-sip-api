'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch the initial watchlist when the app loads
  useEffect(() => {
    fetch('/api/watchlist/funds') // A new, simple API to just get the codes
      .then(res => res.json())
      .then(data => {
        setWatchlist(data);
        setLoading(false);
      });
  }, []);

  const addToWatchlist = (schemeCode) => {
    // Optimistically update the UI
    setWatchlist(prev => [...prev, schemeCode]);
    // Send the update to the server
    fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemeCode }),
    });
  };

  const removeFromWatchlist = (schemeCode) => {
    setWatchlist(prev => prev.filter(code => code !== schemeCode));
    fetch('/api/watchlist', {
      method: 'DELETE', // We will need to create this DELETE handler
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemeCode }),
    });
  };

  const isWatched = (schemeCode) => watchlist.includes(schemeCode);

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isWatched, loading }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}
