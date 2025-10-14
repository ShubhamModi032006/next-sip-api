import { NextResponse } from 'next/server';
import { getCleanSchemeData, findNavOnOrBefore } from '@/utils/mf-helpers';

export async function POST(request, { params }) {
    const { code } = await params;
    try {
        // 1. Destructure all required inputs from the request body
        const { initialInvestment, withdrawalAmount, fromDate, toDate, annualIncrease } = await request.json();

        // 2. Validate inputs to ensure none are missing
        if (!initialInvestment || !withdrawalAmount || !fromDate || !toDate || !annualIncrease) {
            return NextResponse.json({ error: 'Missing required fields for Step-Up SWP' }, { status: 400 });
        }

        // 3. Fetch and clean the necessary NAV data
        const { navHistory } = await getCleanSchemeData(code);
        if (!navHistory || navHistory.length === 0) {
            return NextResponse.json({ error: 'NAV history is empty for this scheme.' }, { status: 400 });
        }

        // 4. Initialize date variables, setting time to noon UTC to avoid timezone errors
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        startDate.setUTCHours(12, 0, 0, 0);
        endDate.setUTCHours(12, 0, 0, 0);

        // 5. Find the NAV for the initial investment date
        const firstNav = findNavOnOrBefore(navHistory, startDate);
        if (!firstNav) {
            throw new Error("Could not determine starting NAV for the investment.");
        }

        // 6. Set up initial state for the calculation loop
        let totalUnits = initialInvestment / firstNav.nav;
        const costBasisPerUnit = firstNav.nav;
        let costBasisRemaining = initialInvestment;
        let totalWithdrawn = 0;
        let portfolioGrowth = [{
            date: startDate.toISOString().split('T')[0],
            value: initialInvestment,
            remainingPrincipal: initialInvestment,
            profit: 0
        }];
        let withdrawalCount = 0;
        let currentWithdrawalDate = new Date(startDate);
        const latestNav = navHistory[navHistory.length - 1];

        // 7. Loop through each month of the withdrawal period
        while (currentWithdrawalDate <= endDate && totalUnits > 0) {
            // Calculate the current withdrawal amount, applying the annual increase
            let currentWithdrawal = withdrawalAmount;
            const yearsDiff = currentWithdrawalDate.getUTCFullYear() - startDate.getUTCFullYear();
            if (yearsDiff > 0) {
                currentWithdrawal = withdrawalAmount * Math.pow(1 + annualIncrease / 100, yearsDiff);
            }

            const navForDate = findNavOnOrBefore(navHistory, currentWithdrawalDate);
            if (navForDate) {
                const unitsToWithdraw = currentWithdrawal / navForDate.nav;
                if (unitsToWithdraw >= totalUnits) {
                    // Portfolio is exhausted; withdraw the remaining value and exit loop
                    totalWithdrawn += totalUnits * navForDate.nav;
                    costBasisRemaining = 0;
                    totalUnits = 0;
                } else {
                    totalUnits -= unitsToWithdraw;
                    totalWithdrawn += currentWithdrawal;
                    costBasisRemaining = Math.max(0, costBasisRemaining - (costBasisPerUnit * unitsToWithdraw));
                }
            }

            // Record the portfolio's value for the graph
            const currentValue = totalUnits * (navForDate?.nav || latestNav.nav);
            const remainingPrincipal = costBasisRemaining;
            const profit = Math.max(0, currentValue - remainingPrincipal);
            portfolioGrowth.push({
                date: currentWithdrawalDate.toISOString().split('T')[0],
                value: currentValue,
                remainingPrincipal,
                profit
            });
            withdrawalCount++;

            // Precisely move to the next month using the clean, bug-free logic
            currentWithdrawalDate = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth() + withdrawalCount, startDate.getUTCDate(), 12);
        }

        // 8. Calculate the final value of any remaining units
        const finalValue = totalUnits * latestNav.nav;


        const totalInvested = initialInvestment;
        const profit = (totalWithdrawn + finalValue) - totalInvested;;
        const absoluteReturn = totalInvested > 0 ? ((finalValue - totalInvested) / totalInvested) * 100 : 0;

        // 9. Return the complete, structured result
        return NextResponse.json({
            initialInvestment,
            totalWithdrawn,
            finalValue,
            profit,
            portfolioGrowth
        });
    }
    catch (error) {
        console.error(`[API Step-Up SWP Error]`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

