'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

function WatchlistPage() {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetch('/api/watchlist')
            .then(res => res.ok ? res.json() : Promise.reject('Failed to load watchlist'))
            .then(data => {
                setWatchlist(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="text-center py-10">Loading your watchlist...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center mb-8">Your Watchlist</h1>

            {watchlist.length === 0 ? (
                <p className="text-center text-gray-500">Your watchlist is empty. Add funds to start monitoring them.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white shadow-md rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-left font-semibold text-gray-600 p-4">Fund Name</th>
                                <th className="text-right font-semibold text-gray-600 p-4">Latest NAV</th>
                                <th className="text-right font-semibold text-gray-600 p-4">1D</th>
                                <th className="text-right font-semibold text-gray-600 p-4">1M</th>
                                <th className="text-right font-semibold text-gray-600 p-4">6M</th>
                                <th className="text-right font-semibold text-gray-600 p-4">1Y</th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchlist.map(fund => (
                                <tr key={fund.schemeCode} className="border-b hover:bg-gray-50">
                                    <td className="p-4">
                                        <Link href={`/scheme/${fund.schemeCode}`} className="font-medium text-blue-600 hover:underline">
                                            {fund.schemeName}
                                        </Link>
                                    </td>
                                    <td className="text-right p-4">₹{fund.latestNav.nav.toFixed(2)}</td>
                                    {fund.returns.map(r => (
                                        <td
                                            key={r.period}
                                            className={`text-right p-4 font-medium ${parseFloat(r.simpleReturn) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                        >
                                            {r.simpleReturn ? `${r.simpleReturn}%` : 'N/A'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default WatchlistPage;
