import { NextResponse } from 'next/server';
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export async function POST(req, { params }) {
  const code = params.code;
  
  try {
    const body = await req.json();
    const { 
      amount, 
      startDate, 
      endDate, 
      frequency, 
      stepUpAmount, 
      stepUpFrequency 
    } = body;
    
    // Validate input
    if (!amount || !startDate || !endDate || !frequency || !stepUpAmount || !stepUpFrequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Convert dates to dayjs objects
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    // Validate dates
    if (!start.isValid() || !end.isValid()) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    if (end.isSameOrBefore(start)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
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

    // Find initial NAV
    const initialNavIndex = sortedNavData.findIndex(item => 
      dayjs(item.date, 'DD-MM-YYYY').isSameOrAfter(start)
    );

    if (initialNavIndex === -1) {
      return NextResponse.json(
        { error: 'No NAV data available for the start date' },
        { status: 400 }
      );
    }

    const initialNav = parseFloat(sortedNavData[initialNavIndex].nav);
    const initialUnits = amount / initialNav;
    
    // Calculate withdrawal schedule
    const withdrawalSchedule = [];
    let currentUnits = initialUnits;
    let currentDate = start;
    let totalWithdrawn = 0;
    let withdrawals = 0;
    let currentWithdrawalAmount = parseFloat(amount);
    let nextStepUpDate = dayjs(start);

    // Calculate next step-up date based on frequency
    const getNextStepUpDate = (date) => {
      switch (stepUpFrequency) {
        case 'yearly':
          return date.add(1, 'year');
        case 'half-yearly':
          return date.add(6, 'month');
        case 'quarterly':
          return date.add(3, 'month');
        default:
          return date.add(1, 'year');
      }
    };

    nextStepUpDate = getNextStepUpDate(nextStepUpDate);

    // Calculate withdrawal frequency in months
    let withdrawalInterval;
    switch (frequency) {
      case 'monthly':
        withdrawalInterval = 1;
        break;
      case 'quarterly':
        withdrawalInterval = 3;
        break;
      case 'yearly':
        withdrawalInterval = 12;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid frequency. Use monthly, quarterly, or yearly' },
          { status: 400 }
        );
    }

    // Simulate withdrawals with step-up
    while (currentDate.isBefore(end) && currentUnits > 0) {
      // Check if it's time for step-up
      if (currentDate.isSameOrAfter(nextStepUpDate)) {
        currentWithdrawalAmount += parseFloat(stepUpAmount);
        nextStepUpDate = getNextStepUpDate(nextStepUpDate);
      }

      // Find NAV for current withdrawal date
      const navIndex = sortedNavData.findIndex(item => 
        dayjs(item.date, 'DD-MM-YYYY').isSameOrAfter(currentDate)
      );

      if (navIndex === -1) break;

      const currentNav = parseFloat(sortedNavData[navIndex].nav);
      const unitsToWithdraw = currentWithdrawalAmount / currentNav;
      
      if (unitsToWithdraw > currentUnits) {
        // Last withdrawal - withdraw remaining units
        const actualWithdrawal = currentUnits * currentNav;
        totalWithdrawn += actualWithdrawal;
        withdrawals++;
        
        withdrawalSchedule.push({
          date: currentDate.format('YYYY-MM-DD'),
          nav: currentNav,
          unitsWithdrawn: currentUnits,
          amountWithdrawn: actualWithdrawal,
          remainingUnits: 0,
          withdrawalAmount: currentWithdrawalAmount
        });
        
        currentUnits = 0;
        break;
      } else {
        currentUnits -= unitsToWithdraw;
        totalWithdrawn += currentWithdrawalAmount;
        withdrawals++;
        
        withdrawalSchedule.push({
          date: currentDate.format('YYYY-MM-DD'),
          nav: currentNav,
          unitsWithdrawn: unitsToWithdraw,
          amountWithdrawn: currentWithdrawalAmount,
          remainingUnits: currentUnits,
          withdrawalAmount: currentWithdrawalAmount
        });
      }

      currentDate = currentDate.add(withdrawalInterval, 'month');
    }

    // Calculate final value
    const latestNav = parseFloat(sortedNavData[sortedNavData.length - 1].nav);
    const finalValue = currentUnits * latestNav;
    const totalValue = totalWithdrawn + finalValue;
    const totalGain = totalValue - amount;
    const totalGainPercentage = (totalGain / amount) * 100;

    // Calculate CAGR
    const years = end.diff(start, 'year', true);
    const cagr = years > 0 ? (Math.pow(totalValue / amount, 1 / years) - 1) * 100 : 0;

    // Calculate step-up statistics
    const stepUpCount = Math.floor(dayjs(end).diff(dayjs(start), 'year', true) / 
      (stepUpFrequency === 'yearly' ? 1 : stepUpFrequency === 'half-yearly' ? 0.5 : 0.25));
    
    const finalWithdrawalAmount = parseFloat(amount) + (stepUpCount * parseFloat(stepUpAmount));

    return NextResponse.json({
      schemeCode: code,
      initialAmount: parseFloat(amount),
      totalWithdrawn: Math.round(totalWithdrawn),
      finalValue: Math.round(finalValue),
      totalValue: Math.round(totalValue),
      totalGain: Math.round(totalGain),
      totalGainPercentage: parseFloat(totalGainPercentage.toFixed(2)),
      cagr: parseFloat(cagr.toFixed(2)),
      withdrawals,
      initialWithdrawalAmount: parseFloat(amount),
      finalWithdrawalAmount: finalWithdrawalAmount,
      stepUpCount,
      stepUpAmount: parseFloat(stepUpAmount),
      stepUpFrequency,
      remainingUnits: parseFloat(currentUnits.toFixed(4)),
      initialUnits: parseFloat(initialUnits.toFixed(4)),
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      frequency,
      withdrawalSchedule: withdrawalSchedule.slice(0, 12), // First 12 withdrawals for display
      summary: {
        averageWithdrawalAmount: Math.round(totalWithdrawn / withdrawals),
        totalUnitsWithdrawn: parseFloat((initialUnits - currentUnits).toFixed(4)),
        averageNAV: parseFloat((totalWithdrawn / (initialUnits - currentUnits)).toFixed(2)),
        stepUpImpact: parseFloat(((finalWithdrawalAmount - parseFloat(amount)) / parseFloat(amount) * 100).toFixed(2))
      }
    });
    
  } catch (err) {
    console.error('Step-up SWP calculation error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
