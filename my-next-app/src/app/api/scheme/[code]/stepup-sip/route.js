import { NextResponse } from 'next/server';
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

export async function POST(request, { params }) {
  const { code } = await params;
  const body = await request.json();

  const { 
    initialAmount, 
    stepUpAmount, 
    stepUpFrequency, 
    startDate, 
    endDate, 
    frequency 
  } = body;

  if (!initialAmount || !stepUpAmount || !stepUpFrequency || !startDate || !endDate || !frequency) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

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
      return NextResponse.json({ error: 'No valid NAV data available' }, { status: 404 });
    }

    const sortedNavData = [...navData].sort((a, b) =>
      dayjs(a.date, 'DD-MM-YYYY').valueOf() - dayjs(b.date, 'DD-MM-YYYY').valueOf()
    );

    let totalUnits = 0;
    let totalInvestment = 0;
    let installments = 0;
    let currentDate = dayjs(startDate);
    const finalDate = dayjs(endDate);
    let navIndex = 0;
    let currentAmount = parseFloat(initialAmount);
    let nextStepUpDate = dayjs(startDate);

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

    const firstNavDate = dayjs(sortedNavData[0].date, 'DD-MM-YYYY');
    if (currentDate.isBefore(firstNavDate)) {
      currentDate = firstNavDate;
    }

    const investmentHistory = [];

    while (currentDate.isSameOrAfter(firstNavDate) && currentDate.isBefore(finalDate)) {
      // Check if it's time for step-up
      if (currentDate.isSameOrAfter(nextStepUpDate)) {
        currentAmount += parseFloat(stepUpAmount);
        nextStepUpDate = getNextStepUpDate(nextStepUpDate);
      }

      // Find appropriate NAV for this investment date
      while (
        navIndex < sortedNavData.length - 1 &&
        dayjs(sortedNavData[navIndex].date, 'DD-MM-YYYY').isBefore(currentDate)
      ) {
        navIndex++;
      }

      const navForInvestment = sortedNavData[navIndex];

      if (navForInvestment) {
        const navValue = parseFloat(navForInvestment.nav);
        const unitsPurchased = currentAmount / navValue;
        totalUnits += unitsPurchased;
        totalInvestment += currentAmount;
        installments++;

        investmentHistory.push({
          date: currentDate.format('YYYY-MM-DD'),
          amount: currentAmount,
          nav: navValue,
          units: unitsPurchased,
          cumulativeUnits: totalUnits,
          cumulativeInvestment: totalInvestment
        });
      }

      // Move to next investment date
      if (frequency === 'monthly') {
        currentDate = currentDate.add(1, 'month');
      } else if (frequency === 'quarterly') {
        currentDate = currentDate.add(3, 'month');
      } else if (frequency === 'yearly') {
        currentDate = currentDate.add(1, 'year');
      }
    }

    const latestNav = parseFloat(sortedNavData[sortedNavData.length - 1].nav);
    const finalValue = totalUnits * latestNav;
    const totalGain = finalValue - totalInvestment;
    const totalGainPercentage = (totalGain / totalInvestment) * 100;

    // Calculate CAGR
    const years = dayjs(finalDate).diff(dayjs(startDate), 'year', true);
    const cagr = years > 0 ? (Math.pow(finalValue / totalInvestment, 1 / years) - 1) * 100 : 0;

    // Calculate step-up statistics
    const stepUpCount = Math.floor(dayjs(finalDate).diff(dayjs(startDate), 'year', true) / 
      (stepUpFrequency === 'yearly' ? 1 : stepUpFrequency === 'half-yearly' ? 0.5 : 0.25));
    
    const finalAmount = parseFloat(initialAmount) + (stepUpCount * parseFloat(stepUpAmount));

    return NextResponse.json({
      schemeCode: code,
      totalInvestment: Math.round(totalInvestment),
      finalValue: Math.round(finalValue),
      totalGain: Math.round(totalGain),
      totalGainPercentage: parseFloat(totalGainPercentage.toFixed(2)),
      cagr: parseFloat(cagr.toFixed(2)),
      installments,
      initialAmount: parseFloat(initialAmount),
      finalAmount: finalAmount,
      stepUpCount,
      stepUpAmount: parseFloat(stepUpAmount),
      stepUpFrequency,
      startDate,
      endDate,
      frequency,
      investmentHistory: investmentHistory.slice(-12), // Last 12 investments for display
      summary: {
        averageMonthlyInvestment: Math.round(totalInvestment / installments),
        totalUnitsPurchased: parseFloat(totalUnits.toFixed(4)),
        averageNAV: parseFloat((totalInvestment / totalUnits).toFixed(2))
      }
    });

  } catch (err) {
    console.error('Step-up SIP calculation error:', err);
    return NextResponse.json(
      { error: 'Failed to calculate step-up SIP', details: err.message },
      { status: 500 }
    );
  }
}
