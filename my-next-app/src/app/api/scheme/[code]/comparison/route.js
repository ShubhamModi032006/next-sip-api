import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import axios from 'axios';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

export async function POST(request, { params }) {
  const { code } = await params;
  const body = await request.json();

  const { amount, startDate, endDate, frequency } = body;

  if (!amount || !startDate || !endDate || !frequency) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Get scheme data
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

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const latestNav = parseFloat(sortedNavData[sortedNavData.length - 1].nav);

    // Calculate SIP
    const sipResult = calculateSIP(sortedNavData, amount, start, end, frequency);
    
    // Calculate Lumpsum
    const lumpsumResult = calculateLumpsum(sortedNavData, amount, start, latestNav);
    
    // Calculate SWP
    const swpResult = calculateSWP(sortedNavData, amount, start, end, frequency);

    // Calculate Step-up SIP (with 10% annual step-up)
    const stepUpAmount = amount * 0.1; // 10% of initial amount
    const stepUpSipResult = calculateStepUpSIP(sortedNavData, amount, stepUpAmount, start, end, frequency);

    return NextResponse.json({
      comparison: {
        sip: {
          totalInvestment: sipResult.totalInvestment,
          finalValue: Math.round(sipResult.finalValue),
          gain: Math.round(sipResult.finalValue - sipResult.totalInvestment),
          gainPercentage: parseFloat(((sipResult.finalValue - sipResult.totalInvestment) / sipResult.totalInvestment * 100).toFixed(2)),
          cagr: sipResult.cagr,
          installments: sipResult.installments
        },
        lumpsum: {
          totalInvestment: lumpsumResult.totalInvestment,
          finalValue: Math.round(lumpsumResult.finalValue),
          gain: Math.round(lumpsumResult.finalValue - lumpsumResult.totalInvestment),
          gainPercentage: parseFloat(((lumpsumResult.finalValue - lumpsumResult.totalInvestment) / lumpsumResult.totalInvestment * 100).toFixed(2)),
          cagr: lumpsumResult.cagr
        },
        swp: {
          totalInvestment: swpResult.totalInvestment,
          totalWithdrawn: Math.round(swpResult.totalWithdrawn),
          finalValue: Math.round(swpResult.finalValue),
          totalValue: Math.round(swpResult.totalValue),
          gain: Math.round(swpResult.totalValue - swpResult.totalInvestment),
          gainPercentage: parseFloat(((swpResult.totalValue - swpResult.totalInvestment) / swpResult.totalInvestment * 100).toFixed(2)),
          cagr: swpResult.cagr,
          withdrawals: swpResult.withdrawals
        },
        stepUpSip: {
          totalInvestment: stepUpSipResult.totalInvestment,
          finalValue: Math.round(stepUpSipResult.finalValue),
          gain: Math.round(stepUpSipResult.finalValue - stepUpSipResult.totalInvestment),
          gainPercentage: parseFloat(((stepUpSipResult.finalValue - stepUpSipResult.totalInvestment) / stepUpSipResult.totalInvestment * 100).toFixed(2)),
          cagr: stepUpSipResult.cagr,
          installments: stepUpSipResult.installments,
          stepUpCount: stepUpSipResult.stepUpCount
        }
      },
      summary: {
        bestPerformer: getBestPerformer(sipResult, lumpsumResult, swpResult, stepUpSipResult),
        period: {
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
          years: parseFloat(end.diff(start, 'year', true).toFixed(2))
        }
      }
    });
    
  } catch (err) {
    console.error('Comparison calculation error:', err);
    return NextResponse.json({ error: 'Failed to calculate comparison', details: err.message }, { status: 500 });
  }
}

function calculateSIP(navData, amount, start, end, frequency) {
  let totalUnits = 0;
  let totalInvestment = 0;
  let installments = 0;
  let currentDate = start;
  let navIndex = 0;

  const firstNavDate = dayjs(navData[0].date, 'DD-MM-YYYY');
  if (currentDate.isBefore(firstNavDate)) {
    currentDate = firstNavDate;
  }

  while (currentDate.isBefore(end)) {
    while (
      navIndex < navData.length - 1 &&
      dayjs(navData[navIndex].date, 'DD-MM-YYYY').isBefore(currentDate)
    ) {
      navIndex++;
    }

    const navForInvestment = navData[navIndex];
    if (navForInvestment) {
      const navValue = parseFloat(navForInvestment.nav);
      const unitsPurchased = amount / navValue;
      totalUnits += unitsPurchased;
      totalInvestment += amount;
      installments++;
    }

    if (frequency === 'monthly') {
      currentDate = currentDate.add(1, 'month');
    } else if (frequency === 'quarterly') {
      currentDate = currentDate.add(3, 'month');
    } else if (frequency === 'yearly') {
      currentDate = currentDate.add(1, 'year');
    }
  }

  const latestNav = parseFloat(navData[navData.length - 1].nav);
  const finalValue = totalUnits * latestNav;
  const years = end.diff(start, 'year', true);
  const cagr = years > 0 ? (Math.pow(finalValue / totalInvestment, 1 / years) - 1) * 100 : 0;

  return { totalInvestment, finalValue, cagr, installments };
}

function calculateLumpsum(navData, amount, start, latestNav) {
  const initialNavIndex = navData.findIndex(item => 
    dayjs(item.date, 'DD-MM-YYYY').isSameOrAfter(start)
  );
  
  if (initialNavIndex === -1) {
    return { totalInvestment: amount, finalValue: amount, cagr: 0 };
  }

  const initialNav = parseFloat(navData[initialNavIndex].nav);
  const unitsPurchased = amount / initialNav;
  const finalValue = unitsPurchased * latestNav;
  const years = dayjs().diff(start, 'year', true);
  const cagr = years > 0 ? (Math.pow(finalValue / amount, 1 / years) - 1) * 100 : 0;

  return { totalInvestment: amount, finalValue, cagr };
}

function calculateSWP(navData, amount, start, end, frequency) {
  const initialNavIndex = navData.findIndex(item => 
    dayjs(item.date, 'DD-MM-YYYY').isSameOrAfter(start)
  );
  
  if (initialNavIndex === -1) {
    return { totalInvestment: amount, totalWithdrawn: 0, finalValue: amount, totalValue: amount, cagr: 0, withdrawals: 0 };
  }

  const initialNav = parseFloat(navData[initialNavIndex].nav);
  const initialUnits = amount / initialNav;
  
  let currentUnits = initialUnits;
  let currentDate = start;
  let totalWithdrawn = 0;
  let withdrawals = 0;

  let withdrawalInterval;
  switch (frequency) {
    case 'monthly': withdrawalInterval = 1; break;
    case 'quarterly': withdrawalInterval = 3; break;
    case 'yearly': withdrawalInterval = 12; break;
    default: withdrawalInterval = 1;
  }

  const totalMonths = end.diff(start, 'month');
  const totalWithdrawals = Math.floor(totalMonths / withdrawalInterval);
  const monthlyWithdrawalAmount = amount / totalWithdrawals;

  while (currentDate.isBefore(end) && currentUnits > 0) {
    const navIndex = navData.findIndex(item => 
      dayjs(item.date, 'DD-MM-YYYY').isSameOrAfter(currentDate)
    );

    if (navIndex === -1) break;

    const currentNav = parseFloat(navData[navIndex].nav);
    const unitsToWithdraw = monthlyWithdrawalAmount / currentNav;
    
    if (unitsToWithdraw > currentUnits) {
      const actualWithdrawal = currentUnits * currentNav;
      totalWithdrawn += actualWithdrawal;
      withdrawals++;
      currentUnits = 0;
      break;
    } else {
      currentUnits -= unitsToWithdraw;
      totalWithdrawn += monthlyWithdrawalAmount;
      withdrawals++;
    }

    currentDate = currentDate.add(withdrawalInterval, 'month');
  }

  const latestNav = parseFloat(navData[navData.length - 1].nav);
  const finalValue = currentUnits * latestNav;
  const totalValue = totalWithdrawn + finalValue;
  const years = end.diff(start, 'year', true);
  const cagr = years > 0 ? (Math.pow(totalValue / amount, 1 / years) - 1) * 100 : 0;

  return { totalInvestment: amount, totalWithdrawn, finalValue, totalValue, cagr, withdrawals };
}

function calculateStepUpSIP(navData, amount, stepUpAmount, start, end, frequency) {
  let totalUnits = 0;
  let totalInvestment = 0;
  let installments = 0;
  let currentDate = start;
  let navIndex = 0;
  let currentAmount = amount;
  let nextStepUpDate = start.add(1, 'year');
  let stepUpCount = 0;

  const firstNavDate = dayjs(navData[0].date, 'DD-MM-YYYY');
  if (currentDate.isBefore(firstNavDate)) {
    currentDate = firstNavDate;
  }

  while (currentDate.isBefore(end)) {
    // Check for step-up
    if (currentDate.isSameOrAfter(nextStepUpDate)) {
      currentAmount += stepUpAmount;
      nextStepUpDate = nextStepUpDate.add(1, 'year');
      stepUpCount++;
    }

    while (
      navIndex < navData.length - 1 &&
      dayjs(navData[navIndex].date, 'DD-MM-YYYY').isBefore(currentDate)
    ) {
      navIndex++;
    }

    const navForInvestment = navData[navIndex];
    if (navForInvestment) {
      const navValue = parseFloat(navForInvestment.nav);
      const unitsPurchased = currentAmount / navValue;
      totalUnits += unitsPurchased;
      totalInvestment += currentAmount;
      installments++;
    }

    if (frequency === 'monthly') {
      currentDate = currentDate.add(1, 'month');
    } else if (frequency === 'quarterly') {
      currentDate = currentDate.add(3, 'month');
    } else if (frequency === 'yearly') {
      currentDate = currentDate.add(1, 'year');
    }
  }

  const latestNav = parseFloat(navData[navData.length - 1].nav);
  const finalValue = totalUnits * latestNav;
  const years = end.diff(start, 'year', true);
  const cagr = years > 0 ? (Math.pow(finalValue / totalInvestment, 1 / years) - 1) * 100 : 0;

  return { totalInvestment, finalValue, cagr, installments, stepUpCount };
}

function getBestPerformer(sip, lumpsum, swp, stepUpSip) {
  const performers = [
    { name: 'SIP', value: sip.finalValue, cagr: sip.cagr },
    { name: 'Lumpsum', value: lumpsum.finalValue, cagr: lumpsum.cagr },
    { name: 'SWP', value: swp.totalValue, cagr: swp.cagr },
    { name: 'Step-up SIP', value: stepUpSip.finalValue, cagr: stepUpSip.cagr }
  ];

  return performers.reduce((best, current) => 
    current.value > best.value ? current : best
  );
}