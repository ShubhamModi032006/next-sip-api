import { NextResponse } from 'next/server';
import { getCleanSchemeData, findNavOnOrBefore } from '@/utils/mf-helpers';

export async function POST(request, { params }) {
  const { code } = await params;
  try {
    const { amount, frequency, fromDate, toDate } = await request.json();
    if (!amount || !frequency || !fromDate || !toDate) {
      return NextResponse.json({ error: 'Missing required fields for SIP calculation' }, { status: 400 });
    }

    const { navHistory } = await getCleanSchemeData(code);
    if (!navHistory || navHistory.length === 0) {
      return NextResponse.json({ error: 'NAV history is empty for this scheme.' }, { status: 400 });
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    const latestNav = navHistory[navHistory.length - 1];

    let totalInvested = 0;
    let totalUnits = 0;
    let currentInvestmentDate = new Date(startDate);
    let investmentGrowth = [];

    while (currentInvestmentDate <= endDate) {
      const navForDate = findNavOnOrBefore(navHistory, currentInvestmentDate);
      if (navForDate) {
        totalInvested += amount;
        totalUnits += amount / navForDate.nav;
      }

      investmentGrowth.push({
        date: currentInvestmentDate.toISOString().split('T')[0],
        invested: totalInvested,
        value: totalUnits * (navForDate?.nav || latestNav.nav)
      });
      
      // Move to the next month for the next installment
      currentInvestmentDate.setUTCMonth(currentInvestmentDate.getUTCMonth() + 1);
    }

    const finalValue = totalUnits * latestNav.nav;
    const absoluteReturn = totalInvested > 0 ? ((finalValue - totalInvested) / totalInvested) * 100 : 0;
    const years = (endDate.getTime() - startDate.getTime()) / 31557600000; // 365.25 days
    const annualizedReturn = (years >= 1 && totalInvested > 0) ? ((Math.pow(finalValue / totalInvested, 1 / years) - 1) * 100) : null;


    
    const profit = finalValue - totalInvested;
    

    return NextResponse.json({
      totalInvested,
      finalValue,
      absoluteReturn,
      profit,
      annualizedReturn,
      investmentGrowth,
    });

  } catch (error) {
    console.error(`[API Regular SIP Error]`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

