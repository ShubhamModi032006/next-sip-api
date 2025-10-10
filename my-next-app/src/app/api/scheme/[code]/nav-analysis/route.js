import { NextResponse } from 'next/server';
import axios from 'axios';
import dayjs from 'dayjs';

// Enhanced caching with TTL
let navCache = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET(request, { params }) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const analysis = searchParams.get('analysis') || 'all'; // all, volatility, trends, performance

  try {
    const now = Date.now();
    
    // Check cache first
    if (navCache[code] && now - navCache[code].lastFetched < CACHE_TTL) {
      return new Response(JSON.stringify(navCache[code].data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    const analysisResult = {
      schemeCode: code,
      totalDataPoints: sortedNavData.length,
      dateRange: {
        start: sortedNavData[0].date,
        end: sortedNavData[sortedNavData.length - 1].date
      }
    };

    // Calculate different types of analysis based on request
    if (analysis === 'all' || analysis === 'volatility') {
      analysisResult.volatility = calculateVolatility(sortedNavData);
    }

    if (analysis === 'all' || analysis === 'trends') {
      analysisResult.trends = calculateTrends(sortedNavData);
    }

    if (analysis === 'all' || analysis === 'performance') {
      analysisResult.performance = calculatePerformance(sortedNavData);
    }

    if (analysis === 'all') {
      analysisResult.summary = calculateSummary(sortedNavData);
    }

    // Cache the result
    navCache[code] = {
      data: analysisResult,
      lastFetched: now
    };

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error('NAV analysis error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

function calculateVolatility(navData) {
  const returns = [];
  
  for (let i = 1; i < navData.length; i++) {
    const prevNav = parseFloat(navData[i - 1].nav);
    const currNav = parseFloat(navData[i].nav);
    const dailyReturn = (currNav - prevNav) / prevNav;
    returns.push(dailyReturn);
  }

  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  // Calculate different volatility measures
  const annualizedVolatility = volatility * Math.sqrt(252); // Assuming 252 trading days
  const monthlyVolatility = volatility * Math.sqrt(21); // Assuming 21 trading days per month

  return {
    daily: parseFloat(volatility.toFixed(6)),
    monthly: parseFloat(monthlyVolatility.toFixed(4)),
    annualized: parseFloat(annualizedVolatility.toFixed(4)),
    returns: returns.slice(-30), // Last 30 returns for chart
    maxDailyReturn: parseFloat(Math.max(...returns).toFixed(6)),
    minDailyReturn: parseFloat(Math.min(...returns).toFixed(6))
  };
}

function calculateTrends(navData) {
  const trends = {
    shortTerm: {}, // 1 month
    mediumTerm: {}, // 3 months
    longTerm: {} // 1 year
  };

  const periods = [
    { name: 'shortTerm', days: 30 },
    { name: 'mediumTerm', days: 90 },
    { name: 'longTerm', days: 365 }
  ];

  periods.forEach(period => {
    const recentData = navData.slice(-period.days);
    if (recentData.length < 2) return;

    const startNav = parseFloat(recentData[0].nav);
    const endNav = parseFloat(recentData[recentData.length - 1].nav);
    const totalReturn = (endNav - startNav) / startNav;
    
    // Calculate trend direction
    const positiveDays = recentData.filter((item, index) => {
      if (index === 0) return false;
      const prevNav = parseFloat(recentData[index - 1].nav);
      const currNav = parseFloat(item.nav);
      return currNav > prevNav;
    }).length;

    const trendStrength = positiveDays / (recentData.length - 1);
    
    trends[period.name] = {
      totalReturn: parseFloat((totalReturn * 100).toFixed(2)),
      trendStrength: parseFloat(trendStrength.toFixed(2)),
      trendDirection: totalReturn > 0 ? 'upward' : 'downward',
      dataPoints: recentData.length
    };
  });

  return trends;
}

function calculatePerformance(navData) {
  const performance = {
    periods: {},
    bestPerforming: {},
    worstPerforming: {}
  };

  // Calculate performance for different periods
  const periods = [
    { name: '1M', days: 30 },
    { name: '3M', days: 90 },
    { name: '6M', days: 180 },
    { name: '1Y', days: 365 },
    { name: '3Y', days: 1095 },
    { name: '5Y', days: 1825 }
  ];

  periods.forEach(period => {
    const recentData = navData.slice(-period.days);
    if (recentData.length < 2) return;

    const startNav = parseFloat(recentData[0].nav);
    const endNav = parseFloat(recentData[recentData.length - 1].nav);
    const totalReturn = (endNav - startNav) / startNav;
    const annualizedReturn = Math.pow(1 + totalReturn, 365 / period.days) - 1;

    performance.periods[period.name] = {
      totalReturn: parseFloat((totalReturn * 100).toFixed(2)),
      annualizedReturn: parseFloat((annualizedReturn * 100).toFixed(2)),
      dataPoints: recentData.length
    };
  });

  // Find best and worst performing periods
  const allReturns = Object.values(performance.periods)
    .map(p => ({ period: Object.keys(performance.periods).find(k => performance.periods[k] === p), return: p.totalReturn }))
    .filter(p => p.return !== undefined);

  if (allReturns.length > 0) {
    performance.bestPerforming = allReturns.reduce((best, current) => 
      current.return > best.return ? current : best
    );
    performance.worstPerforming = allReturns.reduce((worst, current) => 
      current.return < worst.return ? current : worst
    );
  }

  return performance;
}

function calculateSummary(navData) {
  const navs = navData.map(item => parseFloat(item.nav));
  const latestNav = navs[navs.length - 1];
  const firstNav = navs[0];
  
  const totalReturn = (latestNav - firstNav) / firstNav;
  const years = dayjs(navData[navData.length - 1].date, 'DD-MM-YYYY')
    .diff(dayjs(navData[0].date, 'DD-MM-YYYY'), 'year', true);
  
  const cagr = years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0;

  return {
    currentNav: latestNav,
    firstNav: firstNav,
    totalReturn: parseFloat((totalReturn * 100).toFixed(2)),
    cagr: parseFloat((cagr * 100).toFixed(2)),
    totalYears: parseFloat(years.toFixed(2)),
    maxNav: Math.max(...navs),
    minNav: Math.min(...navs),
    averageNav: navs.reduce((sum, nav) => sum + nav, 0) / navs.length
  };
}
