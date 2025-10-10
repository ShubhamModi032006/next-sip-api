import { NextResponse } from 'next/server';
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

export async function POST(req, { params }) {
  const code = params.code;
  
  try {
    const body = await req.json();
    const { amount, startDate } = body;
    
    // Validate input
    if (!amount || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Convert date to dayjs object
    const start = dayjs(startDate);
    
    // Validate date
    if (!start.isValid()) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Get NAV data
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
      return NextResponse.json({ error: 'No valid NAV data available' }, { status: 404 });
    }

    // Sort data chronologically
    const sortedNavData = [...navData].sort((a, b) =>
      dayjs(a.date, 'DD-MM-YYYY').valueOf() - dayjs(b.date, 'DD-MM-YYYY').valueOf()
    );

    // Find NAV data for investment date
    const investmentNavIndex = sortedNavData.findIndex(item => 
      dayjs(item.date, 'DD-MM-YYYY').isSameOrAfter(start)
    );

    if (investmentNavIndex === -1) {
      return NextResponse.json(
        { error: 'No NAV data available for the investment date' },
        { status: 400 }
      );
    }

    const investmentNav = parseFloat(sortedNavData[investmentNavIndex].nav);
    const latestNav = parseFloat(sortedNavData[sortedNavData.length - 1].nav);
    const actualInvestmentDate = dayjs(sortedNavData[investmentNavIndex].date, 'DD-MM-YYYY');
    const currentDate = dayjs();

    // Calculate units purchased
    const unitsPurchased = amount / investmentNav;
    
    // Calculate current value
    const currentValue = unitsPurchased * latestNav;
    const growth = currentValue - amount;
    const growthPercentage = (growth / amount) * 100;

    // Calculate CAGR
    const years = currentDate.diff(actualInvestmentDate, 'year', true);
    const cagr = years > 0 ? (Math.pow(currentValue / amount, 1 / years) - 1) * 100 : 0;

    // Calculate absolute return
    const absoluteReturn = ((latestNav - investmentNav) / investmentNav) * 100;

    // Return response
    return NextResponse.json({
      schemeCode: code,
      initialInvestment: parseFloat(amount),
      currentValue: Math.round(currentValue),
      growth: Math.round(growth),
      growthPercentage: parseFloat(growthPercentage.toFixed(2)),
      cagr: parseFloat(cagr.toFixed(2)),
      absoluteReturn: parseFloat(absoluteReturn.toFixed(2)),
      unitsPurchased: parseFloat(unitsPurchased.toFixed(4)),
      investmentNav: investmentNav,
      currentNav: latestNav,
      investmentDate: actualInvestmentDate.format('YYYY-MM-DD'),
      currentDate: currentDate.format('YYYY-MM-DD'),
      investmentPeriod: {
        years: parseFloat(years.toFixed(2)),
        days: currentDate.diff(actualInvestmentDate, 'day')
      }
    });
    
  } catch (err) {
    console.error('Lumpsum calculation error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}