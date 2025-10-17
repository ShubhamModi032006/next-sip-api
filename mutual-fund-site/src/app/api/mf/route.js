import { NextResponse } from 'next/server';
import dbConnect from '../../../utils/dbConnect';
import Fund from '../../../models/Fund';

// Cache configuration
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

async function getAllFundsData() {
  const now = Date.now();
  if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
    console.log("Returning data from cache.");
    return cachedData;
  }

  console.log("Fetching fresh data...");
  
  let activeFunds = [];
  
  try {
    // Connect to database
    await dbConnect();
    
    // Get active funds from MongoDB
    activeFunds = await Fund.find({})
      .select('code name nav date last_updated_on')
      .lean();
  } catch (error) {
    console.error('Error fetching from MongoDB:', error);
    throw new Error('Failed to fetch active funds from database');
  }
  
  // Get all funds from API
  const response = await fetch('https://api.mfapi.in/mf');
  if (!response.ok) {
    throw new Error('Failed to fetch all funds from API');
  }
  const allFundsFromApi = await response.json();

  // Create a Set of active fund codes for quick lookup
  const activeFundCodes = new Set(activeFunds.map(fund => fund.code));

  // Filter out inactive funds
  const inactiveFunds = allFundsFromApi
    .filter(fund => {
      const code = parseInt(fund.schemeCode);
      return !activeFundCodes.has(code) && fund.schemeName;
    })
    .map(fund => ({
      code: parseInt(fund.schemeCode),
      name: fund.schemeName,
      status: 'inactive'
    }));

  cachedData = {
    active: activeFunds,
    inactive: inactiveFunds
  };
  
  lastFetchTime = now;
  return cachedData;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';
    const status = searchParams.get('status') || 'all'; // 'all', 'active', or 'inactive'

    const allData = await getAllFundsData();
    
    // Determine which funds to show based on status
    let fundsToProcess = [];
    if (status === 'active') {
      fundsToProcess = allData.active;
    } else if (status === 'inactive') {
      fundsToProcess = allData.inactive;
    } else {
      // For 'all', combine both but mark active status
      fundsToProcess = [
        ...allData.active.map(fund => ({ ...fund, status: 'active' })),
        ...allData.inactive
      ];
    }

    // Filter based on search query
    const filteredSchemes = searchQuery
      ? fundsToProcess.filter(scheme => scheme.name.toLowerCase().includes(searchQuery))
      : fundsToProcess;

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
      summary: {
        totalActive: allData.active.length,
        totalInactive: allData.inactive.length
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch mutual fund data' }, { status: 500 });
  }
}