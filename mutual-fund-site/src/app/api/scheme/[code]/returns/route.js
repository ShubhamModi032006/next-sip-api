import { NextResponse } from 'next/server';

// --- Data Fetching Logic (Unchanged) ---
async function getCleanSchemeData(code) {
  const response = await fetch(`https://api.mfapi.in/mf/${code}`);
  if (!response.ok) {
    throw new Error(`Scheme with code ${code} not found from external API.`);
  }
  const rawData = await response.json();
  if (!rawData || !rawData.meta || !Array.isArray(rawData.data)) {
    throw new Error('Invalid data structure received from external API');
  }
  const processedNavHistory = rawData.data
    .map(navEntry => {
      const nav = parseFloat(navEntry.nav);
      const dateParts = navEntry.date.split('-');
      const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      return { date: formattedDate, nav };
    })
    .filter(navEntry => navEntry.nav > 0 && !isNaN(navEntry.nav))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  return processedNavHistory;
}

// --- REFINED HELPER: Finds the NAV on or immediately BEFORE the target date ---
const findNavOnOrBefore = (sortedNavHistory, targetDate) => {
  // Use UTC to avoid timezone issues
  const targetTime = targetDate.getTime();
  let bestMatch = null;
  // Iterate backwards to find the first entry on or before the date
  for (let i = sortedNavHistory.length - 1; i >= 0; i--) {
    const navTime = new Date(sortedNavHistory[i].date).getTime();
    if (navTime <= targetTime) {
      bestMatch = sortedNavHistory[i];
      break;
    }
  }
  return bestMatch;
};

// --- NEW: Precise Date Calculation Function ---
const getPreciseStartDate = (endDate, period) => {
    const startDate = new Date(endDate);
    // Use UTC methods for consistency
    startDate.setUTCHours(0, 0, 0, 0);

    switch (period) {
        case '1m':
            startDate.setUTCMonth(startDate.getUTCMonth() - 1);
            break;
        case '6m':
            startDate.setUTCMonth(startDate.getUTCMonth() - 6);
            break;
        case '1y':
            startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);
            break;
        case '3y':
            startDate.setUTCFullYear(startDate.getUTCFullYear() - 3);
            break;
        case '5y':
            startDate.setUTCFullYear(startDate.getUTCFullYear() - 5);
            break;
        case '10y':
            startDate.setUTCFullYear(startDate.getUTCFullYear() - 10);
            break;
    }

    // This handles the month-end overflow issue.
    // If we wanted Feb 30 and got Mar 1, this rolls it back to the end of Feb.
    if (startDate.getUTCDate() !== endDate.getUTCDate()) {
        startDate.setUTCDate(0);
    }
    
    return startDate;
};


// --- API Handler ---
export async function GET(request, { params }) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period');

  if (!period) {
    return NextResponse.json({ error: 'Period query parameter is required' }, { status: 400 });
  }

  try {
    const navHistory = await getCleanSchemeData(code);

    if (navHistory.length < 2) {
      return NextResponse.json({ error: 'Not enough NAV data to calculate returns' }, { status: 404 });
    }

    const endDateNav = navHistory[navHistory.length - 1];
    const endDate = new Date(endDateNav.date);
    endDate.setUTCHours(0, 0, 0, 0);

    // --- MODIFIED: Use the new precise function ---
    const preciseStartDate = getPreciseStartDate(endDate, period);
    const startDateNav = findNavOnOrBefore(navHistory, preciseStartDate);

    // Check if a valid start date was found
    if (!startDateNav) {
        return NextResponse.json({ error: `Not enough historical data for the ${period} period.` }, { status: 404 });
    }

    const startNavValue = startDateNav.nav;
    const endNavValue = endDateNav.nav;

    const simpleReturn = ((endNavValue - startNavValue) / startNavValue) * 100;
    
    const yearsElapsed = (endDate.getTime() - new Date(startDateNav.date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    let annualizedReturn = null;
    
    if (yearsElapsed >= 1) {
      annualizedReturn = (Math.pow((endNavValue / startNavValue), (1 / yearsElapsed)) - 1) * 100;
    }
    
    const responsePayload = {
      period,
      startDate: startDateNav.date,
      startNav: startNavValue,
      endDate: endDateNav.date,
      endNav: endNavValue,
      simpleReturn: simpleReturn.toFixed(4), // Increased precision before frontend rounding
      annualizedReturn: annualizedReturn ? annualizedReturn.toFixed(4) : null,
    };

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error(`[API ERROR /returns]`, error);
    return NextResponse.json({ error: 'Failed to calculate returns. ' + error.message }, { status: 500 });
  }
}

