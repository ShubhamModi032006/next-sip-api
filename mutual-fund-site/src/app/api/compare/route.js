import { NextResponse } from 'next/server';
// Import the helper functions we created. This keeps our code clean and reusable.
import { getCleanSchemeData, calculateReturnForPeriod } from '@/utils/mf-helpers';

export async function POST(request) {
    try {
        // 1. Get the list of scheme codes from the frontend's request body.
        const { schemeCodes } = await request.json();

        // 2. Validate the input to make sure it's a valid array.
        if (!Array.isArray(schemeCodes) || schemeCodes.length === 0) {
            return NextResponse.json({ error: 'Scheme codes must be a non-empty array.' }, { status: 400 });
        }

        // 3. Process each scheme code in parallel for maximum efficiency.
        //    Promise.all allows us to start all the data fetching at the same time.
        const promises = schemeCodes.map(async (code) => {
            // A. Fetch the fund's metadata and its full NAV history.
            const { meta, navHistory } = await getCleanSchemeData(code);
            
            // B. Define the standard periods for which we want to calculate returns.
            const periods = ['1m', '6m', '1y', '3y', '5y', '10y'];
            
            // C. Calculate the returns for all defined periods.
            const returns = periods.map(p => {
                try {
                    // Use our reusable helper function from the Canvas.
                    return calculateReturnForPeriod(navHistory, p);
                } catch {
                    // If a return can't be calculated (e.g., a 5-year return for a 2-year-old fund),
                    // we'll return a null value so the frontend knows the data is unavailable.
                    return { period: p, simpleReturn: null, annualizedReturn: null };
                }
            });

            // D. Bundle everything into a single, comprehensive object for this fund.
            return {
                code,
                details: {
                    meta,       // For the main info table (Fund House, Category, etc.)
                    returns,    // For the side-by-side returns comparison table
                    navHistory, // For the overlaid performance graph
                }
            };
        });
        
        // 4. Wait for all the parallel operations to complete.
        const results = await Promise.all(promises);

        // 5. Structure the final response.
        //    The frontend will receive an object where each key is a scheme code,
        //    making it easy to look up the data for a specific fund.
        const responseData = {};
        results.forEach(result => {
            responseData[result.code] = result.details;
        });

        // 6. Send the complete dataset back to the frontend.
        return NextResponse.json(responseData);

    } catch (error) {
        // If any part of the process fails, log the error and send a clear message.
        console.error(`[API Compare Error]`, error);
        return NextResponse.json({ error: 'Failed to fetch comparison data. One or more scheme codes may be invalid.' }, { status: 500 });
    }
}

