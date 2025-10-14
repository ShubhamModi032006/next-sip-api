/**
 * Fetches, sanitizes, and returns both metadata and NAV history for a scheme.
 */
export async function getCleanSchemeData(code) {
  const response = await fetch(`https://api.mfapi.in/mf/${code}`);
  if (!response.ok) {
    throw new Error(`Scheme with code ${code} not found from external API.`);
  }
  const rawData = await response.json();
  if (!rawData || !rawData.meta || !Array.isArray(rawData.data)) {
    throw new Error('Invalid data structure received from external API');
  }

  const processedNavHistory = rawData.data
    .map(navEntry => ({
      date: navEntry.date.split('-').reverse().join('-'), // 'dd-mm-yyyy' to 'yyyy-mm-dd'
      nav: parseFloat(navEntry.nav)
    }))
    .filter(nav => nav.nav > 0 && !isNaN(nav.nav))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
    
  return { meta: rawData.meta, navHistory: processedNavHistory }; // Return both parts
}

/**
 * Finds the NAV on or immediately before a target date.
 */
export function findNavOnOrBefore(sortedNavHistory, targetDate) {
  const targetTime = targetDate.getTime();
  let bestMatch = null;
  for (let i = sortedNavHistory.length - 1; i >= 0; i--) {
    const navTime = new Date(sortedNavHistory[i].date).getTime();
    if (navTime <= targetTime) {
      bestMatch = sortedNavHistory[i];
      break;
    }
  }
  return bestMatch;
}

/**
 * NEW: Calculates returns for a specific period (e.g., '1y', '6m').
 * This function encapsulates the logic from your returns API.
 */
export function calculateReturnForPeriod(navHistory, period) {
  if (!navHistory || navHistory.length < 2) {
    throw new Error('Not enough NAV data');
  }

  const endDateNav = navHistory[navHistory.length - 1];
  const endDate = new Date(endDateNav.date);
  let startDate = new Date(endDate);

  switch (period) {
    case '1m': startDate.setMonth(endDate.getMonth() - 1); break;
    case '6m': startDate.setMonth(endDate.getMonth() - 6); break;
    case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
    case '3y': startDate.setFullYear(endDate.getFullYear() - 3); break;
    case '5y': startDate.setFullYear(endDate.getFullYear() - 5); break;
    case '10y': startDate.setFullYear(endDate.getFullYear() - 10); break;
    default: throw new Error('Invalid period');
  }

  const startDateNav = findNavOnOrBefore(navHistory, startDate);
  if (!startDateNav) {
    throw new Error(`No NAV data found for period start`);
  }

  const startNavValue = startDateNav.nav;
  const endNavValue = endDateNav.nav;

  const simpleReturn = ((endNavValue - startNavValue) / startNavValue) * 100;
  const yearsElapsed = (endDate.getTime() - new Date(startDateNav.date).getTime()) / 31557600000;
  
  let annualizedReturn = null;
  if (yearsElapsed >= 1) {
    annualizedReturn = (Math.pow((endNavValue / startNavValue), (1 / yearsElapsed)) - 1) * 100;
  }

  return {
    period,
    simpleReturn: simpleReturn.toFixed(2),
    annualizedReturn: annualizedReturn ? annualizedReturn.toFixed(2) : null,
  };
}

