// File: src/app/api/mf/route.js
import { NextResponse } from 'next/server';

// Let's create a simple in-memory cache to avoid hitting the external API on every request.
let cachedSchemes = null;
let lastFetchTime = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

async function getSchemes() {
  const now = Date.now();
  if (cachedSchemes && (now - lastFetchTime < CACHE_DURATION)) {
    console.log("Returning schemes from cache.");
    return cachedSchemes;
  }

  console.log("Fetching schemes from external API.");
  const response = await fetch('https://api.mfapi.in/mf');
  if (!response.ok) {
    throw new Error('Failed to fetch schemes');
  }
  const data = await response.json();
  
  // Filter out schemes that don't have a name, as they are not useful
  cachedSchemes = data.filter(scheme => scheme.schemeName); 
  lastFetchTime = now;
  
  return cachedSchemes;
}

export async function GET(request) {
  try {
    const allSchemes = await getSchemes();
    
    // Get page and limit from query parameters, with default values
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';

    // Filter schemes based on search query
    const filteredSchemes = searchQuery
      ? allSchemes.filter(scheme => scheme.schemeName.toLowerCase().includes(searchQuery))
      : allSchemes;

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedSchemes = filteredSchemes.slice(startIndex, endIndex);

    // Return the paginated data along with metadata
    return NextResponse.json({
      totalSchemes: filteredSchemes.length,
      totalPages: Math.ceil(filteredSchemes.length / limit),
      currentPage: page,
      schemes: paginatedSchemes,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch mutual fund data' }, { status: 500 });
  }
}