import { NextResponse } from 'next/server';
import axios from 'axios';
import dayjs from 'dayjs';

// Function to calculate beta and alpha
function calculateAlphaBeta(schemeReturns, benchmarkReturns) {
  if (schemeReturns.length !== benchmarkReturns.length || schemeReturns.length < 2) {
    return { alpha: 0, beta: 0, correlation: 0, rSquared: 0 };
  }

  const n = schemeReturns.length;
  
  // Calculate means
  const schemeMean = schemeReturns.reduce((sum, ret) => sum + ret, 0) / n;
  const benchmarkMean = benchmarkReturns.reduce((sum, ret) => sum + ret, 0) / n;

  // Calculate covariance and variance
  let covariance = 0;
  let benchmarkVariance = 0;
  let schemeVariance = 0;

  for (let i = 0; i < n; i++) {
    const schemeDiff = schemeReturns[i] - schemeMean;
    const benchmarkDiff = benchmarkReturns[i] - benchmarkMean;
    
    covariance += schemeDiff * benchmarkDiff;
    benchmarkVariance += benchmarkDiff * benchmarkDiff;
    schemeVariance += schemeDiff * schemeDiff;
  }

  // Calculate beta
  const beta = benchmarkVariance === 0 ? 0 : covariance / benchmarkVariance;
  
  // Calculate alpha (assuming risk-free rate of 6% annually)
  const riskFreeRate = 6; // 6% annual risk-free rate
  const alpha = schemeMean - (riskFreeRate + beta * (benchmarkMean - riskFreeRate));
  
  // Calculate correlation
  const correlation = Math.sqrt((covariance * covariance) / (schemeVariance * benchmarkVariance));
  
  // Calculate R-squared
  const rSquared = correlation * correlation;

  return {
    alpha: parseFloat(alpha.toFixed(4)),
    beta: parseFloat(beta.toFixed(4)),
    correlation: parseFloat(correlation.toFixed(4)),
    rSquared: parseFloat(rSquared.toFixed(4))
  };
}

export async function GET(request, { params }) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '1y';
  const benchmark = searchParams.get('benchmark') || 'nifty50'; // nifty50, sensex, etc.

  try {
    // Get scheme data
    const schemeResponse = await axios.get(`https://api.mfapi.in/mf/${code}`);
    let schemeNavData = schemeResponse.data.data;

    // Clean scheme data
    if (schemeNavData && Array.isArray(schemeNavData)) {
      schemeNavData = schemeNavData.filter(item => {
        const isValidDate = dayjs(item.date, 'DD-MM-YYYY', true).isValid();
        const navValue = parseFloat(item.nav);
        const isValidNav = !isNaN(navValue) && navValue > 0;
        return isValidDate && isValidNav;
      });
    }

    if (!schemeNavData || schemeNavData.length < 2) {
      return NextResponse.json(
        { error: 'Insufficient scheme NAV data' },
        { status: 404 }
      );
    }

    // Sort scheme data
    const sortedSchemeData = [...schemeNavData].sort((a, b) =>
      dayjs(a.date, 'DD-MM-YYYY').valueOf() - dayjs(b.date, 'DD-MM-YYYY').valueOf()
    );

    // Calculate period
    const latestDate = dayjs(sortedSchemeData[sortedSchemeData.length - 1].date, 'DD-MM-YYYY');
    let startDate;
    switch (period) {
      case '1y': startDate = latestDate.subtract(1, 'year'); break;
      case '3y': startDate = latestDate.subtract(3, 'years'); break;
      case '5y': startDate = latestDate.subtract(5, 'years'); break;
      default: startDate = latestDate.subtract(1, 'year');
    }

    // Filter data for the period
    const periodSchemeData = sortedSchemeData.filter(item => 
      dayjs(item.date, 'DD-MM-YYYY').isSameOrAfter(startDate)
    );

    if (periodSchemeData.length < 2) {
      return NextResponse.json(
        { error: 'Insufficient data for the selected period' },
        { status: 400 }
      );
    }

    // Calculate scheme returns (monthly)
    const schemeReturns = [];
    for (let i = 1; i < periodSchemeData.length; i++) {
      const prevNav = parseFloat(periodSchemeData[i - 1].nav);
      const currNav = parseFloat(periodSchemeData[i].nav);
      const monthlyReturn = ((currNav - prevNav) / prevNav) * 100;
      schemeReturns.push(monthlyReturn);
    }

    // For now, we'll use a simplified benchmark calculation
    // In a real implementation, you would fetch actual benchmark data
    const benchmarkReturns = schemeReturns.map(() => 
      (Math.random() - 0.5) * 2 + 0.5 // Simulated benchmark returns
    );

    // Calculate alpha and beta
    const metrics = calculateAlphaBeta(schemeReturns, benchmarkReturns);

    // Calculate additional metrics
    const schemeMean = schemeReturns.reduce((sum, ret) => sum + ret, 0) / schemeReturns.length;
    const benchmarkMean = benchmarkReturns.reduce((sum, ret) => sum + ret, 0) / benchmarkReturns.length;
    
    // Calculate volatility
    const schemeVariance = schemeReturns.reduce((sum, ret) => sum + Math.pow(ret - schemeMean, 2), 0) / schemeReturns.length;
    const schemeVolatility = Math.sqrt(schemeVariance);
    
    const benchmarkVariance = benchmarkReturns.reduce((sum, ret) => sum + Math.pow(ret - benchmarkMean, 2), 0) / benchmarkReturns.length;
    const benchmarkVolatility = Math.sqrt(benchmarkVariance);

    // Calculate Sharpe ratio (assuming 6% annual risk-free rate)
    const annualRiskFreeRate = 6;
    const monthlyRiskFreeRate = annualRiskFreeRate / 12;
    const excessReturn = schemeMean - monthlyRiskFreeRate;
    const sharpeRatio = schemeVolatility === 0 ? 0 : excessReturn / schemeVolatility;

    return NextResponse.json({
      schemeCode: code,
      period,
      benchmark,
      metrics: {
        ...metrics,
        schemeVolatility: parseFloat(schemeVolatility.toFixed(4)),
        benchmarkVolatility: parseFloat(benchmarkVolatility.toFixed(4)),
        sharpeRatio: parseFloat(sharpeRatio.toFixed(4)),
        schemeMeanReturn: parseFloat(schemeMean.toFixed(4)),
        benchmarkMeanReturn: parseFloat(benchmarkMean.toFixed(4))
      },
      dataPoints: periodSchemeData.length,
      note: "Benchmark data is simulated. In production, use actual benchmark indices."
    });

  } catch (err) {
    console.error('Alpha-Beta calculation error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
