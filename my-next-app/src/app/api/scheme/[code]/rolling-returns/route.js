import { NextResponse } from 'next/server';
import axios from 'axios';
import dayjs from 'dayjs';

export async function GET(request, { params }) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '1y'; // 1y, 3y, 5y
  const window = searchParams.get('window') || '1y'; // 1y, 3y, 5y

  try {
    const response = await axios.get(`https://api.mfapi.in/mf/${code}`);
    let navData = response.data.data;

    // Clean and validate data
    if (navData && Array.isArray(navData)) {
      navData = navData.filter(item => {
        const isValidDate = dayjs(item.date, 'DD-MM-YYYY', true).isValid();
        const navValue = parseFloat(item.nav);
        const isValidNav = !isNaN(navValue) && navValue > 0;
        return isValidDate && isValidNav;
      });
    }

    if (!navData || navData.length < 2) {
      return NextResponse.json(
        { error: 'Insufficient NAV data available' },
        { status: 404 }
      );
    }

    // Sort data chronologically
    const sortedNavData = [...navData].sort((a, b) =>
      dayjs(a.date, 'DD-MM-YYYY').valueOf() - dayjs(b.date, 'DD-MM-YYYY').valueOf()
    );

    const latestDate = dayjs(sortedNavData[sortedNavData.length - 1].date, 'DD-MM-YYYY');
    
    // Calculate period in days
    let periodDays;
    switch (period) {
      case '1y': periodDays = 365; break;
      case '3y': periodDays = 1095; break;
      case '5y': periodDays = 1825; break;
      default: periodDays = 365;
    }

    // Calculate window in days
    let windowDays;
    switch (window) {
      case '1y': windowDays = 365; break;
      case '3y': windowDays = 1095; break;
      case '5y': windowDays = 1825; break;
      default: windowDays = 365;
    }

    const rollingReturns = [];
    const startDate = latestDate.subtract(periodDays, 'day');

    // Calculate rolling returns
    for (let i = 0; i < sortedNavData.length; i++) {
      const currentDate = dayjs(sortedNavData[i].date, 'DD-MM-YYYY');
      
      if (currentDate.isAfter(startDate)) {
        const windowStartDate = currentDate.subtract(windowDays, 'day');
        
        // Find NAV data for window start
        const windowStartIndex = sortedNavData.findIndex(item => 
          dayjs(item.date, 'DD-MM-YYYY').isSameOrAfter(windowStartDate)
        );

        if (windowStartIndex !== -1 && windowStartIndex < i) {
          const startNav = parseFloat(sortedNavData[windowStartIndex].nav);
          const endNav = parseFloat(sortedNavData[i].nav);
          
          // Calculate annualized return
          const daysDiff = currentDate.diff(dayjs(sortedNavData[windowStartIndex].date, 'DD-MM-YYYY'), 'day');
          const years = daysDiff / 365.25;
          
          if (years > 0) {
            const annualizedReturn = (Math.pow(endNav / startNav, 1 / years) - 1) * 100;
            
            rollingReturns.push({
              date: currentDate.format('YYYY-MM-DD'),
              startDate: dayjs(sortedNavData[windowStartIndex].date, 'DD-MM-YYYY').format('YYYY-MM-DD'),
              startNav,
              endNav,
              annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
              period: daysDiff
            });
          }
        }
      }
    }

    // Calculate statistics
    const returns = rollingReturns.map(r => r.annualizedReturn);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const maxReturn = Math.max(...returns);
    const minReturn = Math.min(...returns);
    
    // Calculate volatility (standard deviation)
    const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    // Calculate percentile returns
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const p25 = sortedReturns[Math.floor(sortedReturns.length * 0.25)];
    const p50 = sortedReturns[Math.floor(sortedReturns.length * 0.5)];
    const p75 = sortedReturns[Math.floor(sortedReturns.length * 0.75)];

    return NextResponse.json({
      schemeCode: code,
      period,
      window,
      rollingReturns,
      statistics: {
        count: rollingReturns.length,
        average: parseFloat(avgReturn.toFixed(2)),
        maximum: parseFloat(maxReturn.toFixed(2)),
        minimum: parseFloat(minReturn.toFixed(2)),
        volatility: parseFloat(volatility.toFixed(2)),
        p25: parseFloat(p25.toFixed(2)),
        p50: parseFloat(p50.toFixed(2)),
        p75: parseFloat(p75.toFixed(2))
      }
    });

  } catch (err) {
    console.error('Rolling returns calculation error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
