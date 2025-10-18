'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch the initial watchlist when the app loads
  useEffect(() => {
    fetch('/api/watchlist')
      .then(res => res.json())
      .then(data => {
        // store only codes locally for quick checks; normalize to string
        const codes = Array.isArray(data) ? data.map(item => String(item.code)) : [];
        setWatchlist(codes);
        setLoading(false);
      });
  }, []);

  const addToWatchlist = (schemeOrCode) => {
    const code = typeof schemeOrCode === 'object' ? schemeOrCode.schemeCode : schemeOrCode;
    const normalized = String(code);
    // Optimistically update the UI (dedupe)
    setWatchlist(prev => Array.from(new Set([...prev.map(String), normalized])));
    // Send the update to the server
    fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemeCode: code }),
    });
  };

  const removeFromWatchlist = (schemeOrCode) => {
    const code = typeof schemeOrCode === 'object' ? schemeOrCode.schemeCode : schemeOrCode;
    const normalized = String(code);
    setWatchlist(prev => prev.filter(c => String(c) !== normalized));
    fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemeCode: code }),
    });
  };

  const isWatched = (schemeCode) => watchlist.map(String).includes(String(schemeCode));

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isWatched, loading }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}
