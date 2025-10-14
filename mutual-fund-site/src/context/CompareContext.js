'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

// 1. Create the context
const CompareContext = createContext();

// 2. Create the provider component
export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]);
  const router = useRouter();

  const addToCompare = (fund) => {
    // Prevent adding more than 4 funds or adding duplicates
    if (compareList.length < 4 && !compareList.some(item => item.schemeCode === fund.schemeCode)) {
      setCompareList(prevList => [...prevList, fund]);
    }
  };
  
  const addToCompareAndNavigate = (fund) => {
    addToCompare(fund);
    router.push('/compare');
  };

  const removeFromCompare = (schemeCode) => {
    setCompareList(prevList => prevList.filter(item => item.schemeCode !== schemeCode));
  };

  const value = {
    compareList,
    addToCompare,
    removeFromCompare,
    addToCompareAndNavigate,
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

// 3. Create a custom hook for easy access
export function useCompare() {
  return useContext(CompareContext);
}
