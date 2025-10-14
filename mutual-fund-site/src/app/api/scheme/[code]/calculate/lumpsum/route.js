import { NextResponse } from 'next/server';
import { getCleanSchemeData, findNavOnOrBefore } from '@/utils/mf-helpers';

export async function POST(request, { params }) {
  const { code } = await params;
  try {
    const { amount, fromDate, toDate } = await request.json();
    if (!amount || !fromDate || !toDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const { navHistory } = await getCleanSchemeData(code);
    if (!navHistory || navHistory.length === 0) {
      return NextResponse.json({ error: 'NAV history is empty for this scheme.' }, { status: 400 });
    }
    
    const startDateNav = findNavOnOrBefore(navHistory, new Date(fromDate));
    const endDateNav = findNavOnOrBefore(navHistory, new Date(toDate));

    if (!startDateNav || !endDateNav) {
      throw new Error("NAV data not available for the selected period.");
    }

    const finalValue = (amount / startDateNav.nav) * endDateNav.nav;
    const absoluteReturn = ((finalValue - amount) / amount) * 100;
    
    const years = (new Date(endDateNav.date).getTime() - new Date(startDateNav.date).getTime()) / 31557600000; // 365.25 days
    const annualizedReturn = years >= 1 ? ((Math.pow(finalValue / amount, 1 / years) - 1) * 100) : null;
    const totalInvested = amount;
    const profit = finalValue - totalInvested;


    return NextResponse.json({
      totalInvested: amount,
      finalValue,
      absoluteReturn,
      profit,
      annualizedReturn,
      startDateNav,
      endDateNav,
    });

  } catch (error) {
    console.error(`[API Lumpsum Error]`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
