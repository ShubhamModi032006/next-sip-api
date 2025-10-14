// File: src/app/api/scheme/[code]/route.js

import { NextResponse } from 'next/server';

// In-memory cache for individual scheme data.
// A Map is better here to store multiple schemes by their code.
const cachedSchemeData = new Map();
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

export async function GET(request, { params }) {
  const { code } = await params; // Extract the scheme code from the URL, e.g., '120503'

  if (!code) {
    return NextResponse.json({ error: 'Scheme code is required' }, { status: 400 });
  }

  try {
    const now = Date.now();
    
    // 1. Check the cache first
    if (cachedSchemeData.has(code)) {
      const { data, timestamp } = cachedSchemeData.get(code);
      if (now - timestamp < CACHE_DURATION) {
        console.log(`Returning data for scheme ${code} from cache.`);
        return NextResponse.json(data);
      }
    }

    // 2. If not in cache or expired, fetch from the external API
    console.log(`Fetching fresh data for scheme ${code} from external API.`);
    const response = await fetch(`https://api.mfapi.in/mf/${code}`);

    if (!response.ok) {
      // If the API returns a 404 or other error, it likely means the scheme code is invalid.
      return NextResponse.json({ error: `Scheme with code ${code} not found.` }, { status: 404 });
    }

    const rawData = await response.json();

    // 3. --- DATA VALIDATION AND SANITIZATION (The most important part!) ---
    if (!rawData || !rawData.meta || !Array.isArray(rawData.data)) {
        throw new Error('Invalid data structure received from external API');
    }

    const processedNavHistory = rawData.data
      .map(navEntry => {
        // A. Convert NAV from string to a floating-point number.
        const nav = parseFloat(navEntry.nav);
        
        // B. Standardize the date format from 'dd-mm-yyyy' to 'yyyy-mm-dd'.
        // This is crucial for correct sorting and for charting libraries.
        const dateParts = navEntry.date.split('-');
        const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

        return {
          date: formattedDate,
          nav: nav,
        };
      })
      // C. Filter out any entries with an invalid or zero NAV.
      // A NAV of 0 is useless for calculations and can cause division-by-zero errors.
      .filter(navEntry => navEntry.nav > 0 && !isNaN(navEntry.nav))
      // D. Sort the data chronologically (oldest to newest).
      // We cannot assume the API always returns data in the correct order.
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const result = {
      meta: rawData.meta,
      navHistory: processedNavHistory,
      // Add some useful summary data for quick access on the frontend
      summary: {
        firstNav: processedNavHistory.length > 0 ? processedNavHistory[0] : null,
        latestNav: processedNavHistory.length > 0 ? processedNavHistory[processedNavHistory.length - 1] : null,
        totalNavPoints: processedNavHistory.length,
      }
    };
    
    // 4. Store the processed, clean data in our cache
    cachedSchemeData.set(code, { data: result, timestamp: now });

    // 5. Return the final, high-quality data
    return NextResponse.json(result);

  } catch (error) {
    console.error(`Error fetching data for scheme ${code}:`, error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}