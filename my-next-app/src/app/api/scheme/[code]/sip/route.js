// src/app/api/scheme/[code]/sip/route.js

import { NextResponse } from 'next/server';
import axios from 'axios';
import dayjs from 'dayjs';
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
    const response = await axios.get(`https://api.mfapi.in/mf/${code}`);
    let navData = response.data.data;

    if (navData && Array.isArray(navData)) {
      navData = navData.filter(item => {
        const isValidDate = dayjs(item.date, 'DD-MM-YYYY', true).isValid();
        const navValue = parseFloat(item.nav);
        const isValidNav = !isNaN(navValue) && navValue > 0;
        return isValidDate && isValidNav;
      });
    }

    if (!navData || navData.length < 2) {
      return NextResponse.json({ error: 'No valid NAV data available for this scheme' }, { status: 404 });
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

    const firstNavDate = dayjs(sortedNavData[0].date, 'DD-MM-YYYY');
    if (currentDate.isBefore(firstNavDate)) {
      currentDate = firstNavDate;
    }

    // Corrected the loop condition to stop BEFORE the final date
    while (currentDate.isSameOrAfter(firstNavDate) && currentDate.isBefore(finalDate)) {
      while (
        navIndex < sortedNavData.length - 1 &&
        dayjs(sortedNavData[navIndex].date, 'DD-MM-YYYY').isBefore(currentDate)
      ) {
        navIndex++;
      }

      const navForInvestment = sortedNavData[navIndex];

      if (navForInvestment) {
        const navValue = parseFloat(navForInvestment.nav);
        const unitsPurchased = amount / navValue;
        totalUnits += unitsPurchased;
        totalInvestment += amount;
        installments++;
      }

      if (frequency === 'monthly') {
        currentDate = currentDate.add(1, 'month');
      }
    }

    const latestNav = parseFloat(sortedNavData[sortedNavData.length - 1].nav);
    const finalValue = totalUnits * latestNav;

    return NextResponse.json({
      totalInvestment: Math.round(totalInvestment),
      finalValue: Math.round(finalValue),
      installments,
      amountPerInstallment: amount,
      startDate,
      endDate,
    });

  } catch (err) {
    console.error('SIP API Error:', err);
    return NextResponse.json({ error: 'Failed to calculate SIP', details: err.message }, { status: 500 });
  }
}