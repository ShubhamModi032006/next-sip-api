import { NextResponse } from 'next/server';
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// Extend dayjs with the necessary plugin
dayjs.extend(isSameOrAfter);

export async function GET(request, { params }) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period');

  try {
    const response = await axios.get(`https://api.mfapi.in/mf/${code}`);
    let navData = response.data.data;

    // Step 1: Pre-emptively clean the data to remove any malformed entries.
    // This prevents crashes from invalid dates or NAV values.
    if (navData && Array.isArray(navData)) {
      navData = navData.filter(item => {
        // Use strict parsing for the date
        const isValidDate = dayjs(item.date, 'DD-MM-YYYY', true).isValid();
        const navValue = parseFloat(item.nav);
        // Ensure NAV is a valid, positive number
        const isValidNav = !isNaN(navValue) && navValue > 0;
        return isValidDate && isValidNav;
      });
    }

    if (!navData || navData.length < 2) {
      return NextResponse.json(
        { error: 'Insufficient clean NAV data available' },
        { status: 404 }
      );
    }

    // Step 2: Sort the clean data from oldest to newest.
    const sortedNavData = [...navData].sort((a, b) => {
      return dayjs(a.date, 'DD-MM-YYYY').valueOf() - dayjs(b.date, 'DD-MM-YYYY').valueOf();
    });

    // Step 3: Identify the most recent data point as our end point.
    const latestNavEntry = sortedNavData[sortedNavData.length - 1];
    const latestDate = dayjs(latestNavEntry.date, 'DD-MM-YYYY');
    const endNav = parseFloat(latestNavEntry.nav);

    // Step 4: Calculate the theoretical "start date" by subtracting the period.
    let startDate;
    switch (period) {
      case '1m': startDate = latestDate.subtract(1, 'month'); break;
      case '3m': startDate = latestDate.subtract(3, 'month'); break;
      case '6m': startDate = latestDate.subtract(6, 'month'); break;
      case '1y': startDate = latestDate.subtract(1, 'year'); break;
      case '5y': startDate = latestDate.subtract(5, 'years'); break;
      case '10y': startDate = latestDate.subtract(10, 'years'); break;
      default:
        return NextResponse.json(
          { error: 'Invalid period. Use one of: 1m, 3m, 6m, 1y, 5y, 10y' },
          { status: 400 }
        );
    }

    // Step 5: Find the first available data point on or after our target start date.
    const startIndex = sortedNavData.findIndex(item => {
      const itemDate = dayjs(item.date, 'DD-MM-YYYY');
      return itemDate.isSameOrAfter(startDate);
    });

    if (startIndex === -1 || startIndex === sortedNavData.length - 1) {
      return NextResponse.json(
        { error: 'Insufficient data for the selected period' },
        { status: 400 }
      );
    }

    const startNavEntry = sortedNavData[startIndex];
    const startNav = parseFloat(startNavEntry.nav);
    const actualStartDate = dayjs(startNavEntry.date, 'DD-MM-YYYY');

    // Step 6: Calculate the Price Return.
    const absoluteReturn = ((endNav - startNav) / startNav) * 100;
    // Step 7: Calculate the annualized return (CAGR).
    const days = latestDate.diff(actualStartDate, 'day');
    let annualizedReturn = null;

    if (days >= 365) {
      const years = days / 365.25;
      annualizedReturn = (Math.pow(1 + (absoluteReturn / 100), 1 / years) - 1) * 100;
    }

    return NextResponse.json({
      schemeCode: code,
      period,
      startNav: startNavEntry.nav,
      endNav: latestNavEntry.nav,
      absoluteReturn,
      annualizedReturn,
    });

  } catch (err) {
    console.error('Returns calculation error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}