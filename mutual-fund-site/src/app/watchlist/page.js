'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AnimatedWrapper, HoverCard, StaggerContainer, StaggerItem } from '@/components/ui/animated-wrapper';
import { Star, TrendingUp, TrendingDown, ExternalLink, Trash2, AlertCircle } from 'lucide-react';

function WatchlistPage() {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetch('/api/watchlist')
            .then(res => res.ok ? res.json() : Promise.reject('Failed to load watchlist'))
            .then(data => {
                setWatchlist(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                setError(typeof err === 'string' ? err : err?.message || 'Failed to load watchlist');
                setLoading(false);
            });
    }, []);

    const handleRemoveFromWatchlist = async (fundCode) => {
        try {
            await fetch(`/api/watchlist`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schemeCode: fundCode })
            });
            setWatchlist(watchlist.filter(item => item.code !== fundCode));
        } catch (err) {
            console.error('Error removing from watchlist:', err);
        }
    };

    const getReturnColor = (value) => {
        if (value > 0) return 'text-green-600';
        if (value < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getReturnIcon = (value) => {
        if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <AnimatedWrapper animation="fadeInUp">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center space-x-2 py-4">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-600">{error}</span>
                    </CardContent>
                </Card>
            </AnimatedWrapper>
        );
    }

    return (
        <div className="space-y-8">
            <AnimatedWrapper animation="fadeInUp">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Your Watchlist</h1>
                    <p className="text-xl text-gray-600">Monitor your favorite mutual funds</p>
                </div>
            </AnimatedWrapper>

            {watchlist.length === 0 ? (
                <AnimatedWrapper animation="fadeInUp">
                    <Card>
                        <CardContent className="text-center py-12">
                            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
                            <p className="text-muted-foreground mb-4">
                                Add funds to start monitoring them
                            </p>
                            <Button asChild>
                                <Link href="/funds">
                                    Browse Funds
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </AnimatedWrapper>
            ) : (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StaggerItem>
                            <HoverCard>
                                <Card className="hover-lift">
                                    <CardContent className="p-6 text-center">
                                        <div className="flex items-center justify-center mb-4">
                                            <Star className="h-8 w-8 text-yellow-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-yellow-600">
                                            {watchlist.length}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">Watched Funds</p>
                                    </CardContent>
                                </Card>
                            </HoverCard>
                        </StaggerItem>

                        <StaggerItem>
                            <HoverCard>
                                <Card className="hover-lift">
                                    <CardContent className="p-6 text-center">
                                        <div className="flex items-center justify-center mb-4">
                                            <TrendingUp className="h-8 w-8 text-green-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-green-600">
                                            {watchlist.filter(fund => 
                                                fund.returns && fund.returns['1Y'] > 0
                                            ).length}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">Positive 1Y Returns</p>
                                    </CardContent>
                                </Card>
                            </HoverCard>
                        </StaggerItem>

                        <StaggerItem>
                            <HoverCard>
                                <Card className="hover-lift">
                                    <CardContent className="p-6 text-center">
                                        <div className="flex items-center justify-center mb-4">
                                            <TrendingDown className="h-8 w-8 text-red-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-red-600">
                                            {watchlist.filter(fund => 
                                                fund.returns && fund.returns['1Y'] < 0
                                            ).length}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">Negative 1Y Returns</p>
                                    </CardContent>
                                </Card>
                            </HoverCard>
                        </StaggerItem>
                    </StaggerContainer>

                    {/* Watchlist Table */}
                    <AnimatedWrapper animation="fadeInUp" delay={0.2}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Watched Funds</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fund Name</TableHead>
                                            <TableHead>Code</TableHead>
                                            <TableHead>NAV</TableHead>
                                            <TableHead>1D</TableHead>
                                            <TableHead>1M</TableHead>
                                            <TableHead>6M</TableHead>
                                            <TableHead>1Y</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {watchlist.map((fund, index) => (
                                            <TableRow key={`${fund.code || 'unknown'}-${index}`}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <Star className="h-4 w-4 text-yellow-500" />
                                                        <span className="line-clamp-1">{fund.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{fund.code}</Badge>
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    ₹{(typeof fund.nav === 'number' ? fund.nav.toFixed(2) : 'N/A')}
                                                </TableCell>
                                                {['1D', '1M', '6M', '1Y'].map(period => (
                                                    <TableCell key={period}>
                                                        {fund.returns && fund.returns[period] !== undefined ? (
                                                            <div className="flex items-center space-x-1">
                                                                {getReturnIcon(fund.returns[period])}
                                                                <span className={getReturnColor(fund.returns[period])}>
                                                                    {Number(fund.returns[period]).toFixed(2)}%
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>
                                                ))}
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="hover-scale"
                                                        >
                                                            <Link href={`/scheme/${fund.code}`} className="flex items-center space-x-1">
                                                                <ExternalLink className="h-4 w-4" />
                                                                <span>View</span>
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleRemoveFromWatchlist(fund.code)}
                                                            className="hover-scale text-red-600 hover:text-red-700 hover:border-red-300"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </AnimatedWrapper>
                </div>
            )}
        </div>
    );
}

export default WatchlistPage;