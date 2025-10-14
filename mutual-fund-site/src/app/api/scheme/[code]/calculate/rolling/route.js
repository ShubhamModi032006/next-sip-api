import { NextResponse } from 'next/server';
import { getCleanSchemeData, findNavOnOrBefore } from '@/utils/mf-helpers';

export async function POST(request, { params }) {
    const { code } = await params;
    try {
        const { periodYears, frequencyDays } = await request.json();
        const { navHistory } = await getCleanSchemeData(code);
        if (!navHistory || navHistory.length < 2) {
            throw new Error("Not enough NAV data to calculate returns.");
        }

        

        const returns = [];
        const periodMs = periodYears * 365.25 * 24 * 60 * 60 * 1000;

        for (let i = 0; i < navHistory.length; i += frequencyDays) {
            const startDate = new Date(navHistory[i].date);
            const endDate = new Date(startDate.getTime() + periodMs);
            const startNav = navHistory[i];
            const endNav = findNavOnOrBefore(navHistory, endDate);

            if (startNav && endNav && new Date(endNav.date) > startDate) {
                const years = (new Date(endNav.date).getTime() - startDate.getTime()) / 31557600000;
                if (years >= periodYears * 0.95) {
                    const cagr = (Math.pow(endNav.nav / startNav.nav, 1 / years) - 1) * 100;
                    returns.push({ date: startNav.date, cagr });
                }
            }
        }

        if (returns.length === 0) {
            throw new Error(`Could not calculate rolling returns for a ${periodYears}-year period. The fund may not have enough history.`);
        }

        const returnsValues = returns.map(r => r.cagr);
        
        // --- NEW CALCULATION LOGIC ---

        // 1. Median Calculation
        const sortedReturns = [...returnsValues].sort((a, b) => a - b);
        const mid = Math.floor(sortedReturns.length / 2);
        const median = sortedReturns.length % 2 === 0
            ? (sortedReturns[mid - 1] + sortedReturns[mid]) / 2
            : sortedReturns[mid];

        // 2. Volatility (Standard Deviation) Calculation
        const average = returnsValues.reduce((a, b) => a + b, 0) / returnsValues.length;
        const squaredDiffs = returnsValues.map(value => Math.pow(value - average, 2));
        const avgSquaredDiff = squaredDiffs.reduce((sum, value) => sum + value, 0) / squaredDiffs.length;
        const volatility = Math.sqrt(avgSquaredDiff);
        
        // --- END OF NEW LOGIC ---

        const max = Math.max(...returnsValues);
        const min = Math.min(...returnsValues);

        return NextResponse.json({
            average,
            max,
            min,
            median,      // Added
            volatility,  // Added
            count: returns.length,
            returnsData: returns
        });

    } catch (error) {
        console.error(`[API Rolling Error]`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

