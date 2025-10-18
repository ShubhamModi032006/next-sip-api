import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect'; // We'll create this utility next
import Watchlist from '@/models/Watchlist';
import { getCleanSchemeData, calculateReturnForPeriod } from '@/utils/mf-helpers';

// A utility function to get the user's ID (for now, a mock ID)
const getUserId = () => 'mock_user_123';

// --- GET Request: Fetch the watchlist and calculate performance ---
export async function GET() {
    const userId = getUserId();
    await dbConnect();

    try {
        const userWatchlist = await Watchlist.findOne({ userId });
        if (!userWatchlist || userWatchlist.funds.length === 0) {
            return NextResponse.json([]); // Return an empty array if no watchlist
        }

        // For each fund in the watchlist, fetch its data and calculate returns
        const promises = userWatchlist.funds.map(async (code) => {
            const { meta, navHistory } = await getCleanSchemeData(code);
            const periods = ['1D', '1M', '6M', '1Y']; // UI expects caps keys
            
            // Calculate returns for all defined periods
            const returns = periods.map(p => {
                try {
                    const ret = calculateReturnForPeriod(navHistory, p.toLowerCase());
                    return { period: p, simpleReturn: ret.simpleReturn };
                } catch {
                    return { period: p, simpleReturn: null };
                }
            });

            return {
                code: meta.scheme_code,
                name: meta.scheme_name,
                nav: parseFloat(navHistory[navHistory.length - 1]?.nav || 0),
                // shape for UI: returns as object with caps keys
                returns: returns.reduce((acc, r) => {
                    acc[r.period] = r.simpleReturn ?? undefined;
                    return acc;
                }, {}),
            };
        });

        const watchlistWithData = await Promise.all(promises);
        return NextResponse.json(watchlistWithData);

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
    }
}


// --- POST Request: Add a fund to the watchlist ---
export async function POST(request) {
    const userId = getUserId();
    await dbConnect();

    try {
        const { schemeCode } = await request.json();
        if (!schemeCode) {
            return NextResponse.json({ error: 'Scheme code is required' }, { status: 400 });
        }

        // Find the user's watchlist and add the fund if it's not already there
        const userWatchlist = await Watchlist.findOneAndUpdate(
            { userId },
            { $addToSet: { funds: schemeCode } }, // $addToSet prevents duplicates
            { upsert: true, new: true } // `upsert` creates it if it doesn't exist
        );

        return NextResponse.json(userWatchlist.funds);

    } catch (error) {
        return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }
}

// --- DELETE Request: Remove a fund from the watchlist ---
export async function DELETE(request) {
    const userId = getUserId();
    await dbConnect();
    try {
        const { schemeCode } = await request.json();
        if (!schemeCode) {
            return NextResponse.json({ error: 'Scheme code is required' }, { status: 400 });
        }
        const userWatchlist = await Watchlist.findOneAndUpdate(
            { userId },
            { $pull: { funds: schemeCode } },
            { new: true }
        );
        return NextResponse.json(userWatchlist ? userWatchlist.funds : []);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }
}
