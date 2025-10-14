import { NextResponse } from 'next/server';
import { getCleanSchemeData, findNavOnOrBefore } from '@/utils/mf-helpers';

export async function POST(request, { params }) {
    // The { params } object contains the dynamic parts of the URL, in this case, the scheme 'code'.
    const { code } = await params;
    try {
        // 1. Get User Inputs
        // Read the JSON body from the frontend's request.
        const { initialInvestment, withdrawalAmount, fromDate, toDate } = await request.json();

        // 2. Validate Inputs
        // Ensure all necessary data has been sent. If not, return a clear error.
        if (!initialInvestment || !withdrawalAmount || !fromDate || !toDate) {
            return NextResponse.json({ error: 'Missing required fields for SWP calculation.' }, { status: 400 });
        }

        // 3. Fetch and Prepare Data
        // Use our reliable helper to get the clean, sorted NAV history for the fund.
        const { navHistory } = await getCleanSchemeData(code);
        if (!navHistory || navHistory.length === 0) {
            return NextResponse.json({ error: 'NAV history is empty for this scheme.' }, { status: 400 });
        }

        // 4. Initialize Dates
        // Set dates to noon UTC to prevent any errors from timezone differences or daylight saving changes.
        const startDate = new Date(fromDate);
        startDate.setUTCHours(12, 0, 0, 0);
        const endDate = new Date(toDate);
        endDate.setUTCHours(12, 0, 0, 0);

        // 5. Find Initial NAV
        // Determine the NAV on the day the investment was made to calculate initial units.
        const firstNav = findNavOnOrBefore(navHistory, startDate);
        if (!firstNav) {
            throw new Error("Could not determine starting NAV for the investment period. The fund may not have existed on this date.");
        }

        // 6. Setup for Calculation Loop
        let totalUnits = initialInvestment / firstNav.nav;
        const costBasisPerUnit = firstNav.nav; // initial buy price per unit
        let costBasisRemaining = initialInvestment; // principal remaining based on units
        let totalWithdrawn = 0;
        // The `portfolioGrowth` array will store data for our frontend graph. Start with the initial investment value.
        let portfolioGrowth = [{
            date: startDate.toISOString().split('T')[0],
            value: initialInvestment,
            remainingPrincipal: initialInvestment,
            profit: 0
        }];
        let withdrawalCount = 0;
        let currentWithdrawalDate = new Date(startDate);
        const latestNav = navHistory[navHistory.length - 1];

        // 7. The Main Calculation Loop
        // This loop runs for each month in the selected period, as long as there are units left in the fund.
        while (currentWithdrawalDate <= endDate && totalUnits > 0) {
            const navForDate = findNavOnOrBefore(navHistory, currentWithdrawalDate);

            if (navForDate) {
                const unitsToWithdraw = withdrawalAmount / navForDate.nav;

                // Handle the case where the portfolio is about to be emptied.
                if (unitsToWithdraw >= totalUnits) {
                    // Withdraw the entire remaining value.
                    totalWithdrawn += totalUnits * navForDate.nav;
                    // All units sold -> principal remaining becomes 0
                    costBasisRemaining = 0;
                    totalUnits = 0; // Portfolio is now empty.
                } else {
                    // Standard withdrawal.
                    totalUnits -= unitsToWithdraw;
                    totalWithdrawn += withdrawalAmount;
                    // Reduce remaining principal proportionally by cost basis per unit
                    costBasisRemaining = Math.max(0, costBasisRemaining - (costBasisPerUnit * unitsToWithdraw));
                }
            }

            // Record the portfolio's value after this month's withdrawal for the graph.
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

            // CRITICAL: Move to the next month precisely, using the logic from our working SIP file.
            // This prevents the "13 installments in a year" bug.
            currentWithdrawalDate = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth() + withdrawalCount, startDate.getUTCDate(), 12);
        }

        // 8. Calculate Final Values
        // After the loop, calculate the final value of any remaining units.
        const finalValue = totalUnits * latestNav.nav;
        const totalInvested = initialInvestment;
        const profit = (totalWithdrawn + finalValue) - totalInvested;
        const absoluteReturn = totalInvested > 0 ? ((finalValue - totalInvested) / totalInvested) * 100 : 0;

        // 9. Send the Result
        // Return a clean JSON object with all the calculated data to the frontend.
        return NextResponse.json({
            initialInvestment,
            totalWithdrawn,
            finalValue,
            profit,
            portfolioGrowth
        });

    } catch (error) {
        // If anything goes wrong, log the error on the server and send a helpful message to the frontend.
        console.error(`[API Regular SWP Error]`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

