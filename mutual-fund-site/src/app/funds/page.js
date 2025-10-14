'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AnimatedWrapper, HoverCard, StaggerContainer, StaggerItem } from '@/components/ui/animated-wrapper';
import WatchlistButton from '@/components/WatchlistButton';
import { Search, Star, TrendingUp, TrendingDown, ExternalLink, Filter } from 'lucide-react';

export default function FundsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsByCode, setDetailsByCode] = useState({});

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setLoading(true);
      fetch(`/api/mf?page=1&limit=12&q=${searchQuery}`)
        .then((res) => res.json())
        .then((apiData) => {
          setData(apiData);
          setLoading(false);
          setPage(1); // Reset to first page on new search
        });
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch data when page changes
  useEffect(() => {
    if (!searchQuery) { // Only run if not searching
      setLoading(true);
      fetch(`/api/mf?page=${page}&limit=12`)
        .then((res) => res.json())
        .then((apiData) => {
          setData(apiData);
          setLoading(false);
        });
    }
  }, [page, searchQuery]);

  // Fetch extra details per scheme (name, latest nav, category)
  useEffect(() => {
    if (!data || !data.schemes) return;
    const codes = data.schemes
      .map((s) => s.schemeCode || s.code)
      .filter(Boolean);
    const uniqueCodes = Array.from(new Set(codes));
    if (uniqueCodes.length === 0) return;

    let cancelled = false;
    Promise.all(
      uniqueCodes.map(async (code) => {
        try {
          const res = await fetch(`/api/scheme/${code}`);
          if (!res.ok) return [code, null];
          const json = await res.json(); // Prefer new shape { meta, navHistory, summary }
          let latestNav = null;
          // Candidate 1: summary.latestNav.nav (new shape from our API)
          if (json?.summary?.latestNav?.nav != null) {
            latestNav = Number(json.summary.latestNav.nav);
          }
          // Candidate 2: last of navHistory (numbers)
          if (latestNav == null && Array.isArray(json?.navHistory) && json.navHistory.length > 0) {
            latestNav = Number(json.navHistory[json.navHistory.length - 1].nav);
          }
          // Candidate 3: external raw data shape { data: [{date, nav: string}] } latest first
          if (latestNav == null && Array.isArray(json?.data) && json.data.length > 0) {
            const first = Number.parseFloat(json.data[0].nav);
            const last = Number.parseFloat(json.data[json.data.length - 1].nav);
            latestNav = Number.isFinite(first) ? first : (Number.isFinite(last) ? last : null);
          }
          const mapped = {
            name: json.meta?.scheme_name || null,
            category: json.meta?.scheme_category || null,
            fundHouse: json.meta?.fund_house || null,
            nav: latestNav,
          };
          return [code, mapped];
        } catch (e) {
          return [code, null];
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      const map = {};
      for (const [code, payload] of entries) {
        map[code] = payload;
      }
      setDetailsByCode((prev) => ({ ...prev, ...map }));
    });

    return () => { cancelled = true; };
  }, [data]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="space-y-8">
      <AnimatedWrapper animation="fadeInUp">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">All Mutual Funds</h1>
          <p className="text-xl text-gray-600">Discover and explore mutual fund schemes</p>
        </div>
      </AnimatedWrapper>

      {/* Search Section */}
      <AnimatedWrapper animation="fadeInUp" delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Search Funds</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                placeholder="Search for mutual funds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </AnimatedWrapper>

      {/* Loading State */}
      {loading && (
        <AnimatedWrapper animation="fadeIn">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      )}

      {/* Funds Grid */}
      {data && data.schemes && data.schemes.length > 0 && (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.schemes.map((scheme, index) => {
            const code = scheme.schemeCode || scheme.code;
            const details = code ? detailsByCode[code] : null;
            const schemeName = details?.name || scheme.schemeName || scheme.name || 'Unnamed Scheme';
            const category = details?.category || scheme.category || 'N/A';
            const nav = typeof details?.nav === 'number' ? details.nav : (typeof scheme.nav === 'number' ? scheme.nav : null);
            return (
            <StaggerItem key={code || index}>
              <HoverCard className="h-full">
                <Card className="h-full hover-lift border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 mb-2">
                          {schemeName}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {code || 'N/A'}
                        </Badge>
                      </div>
                      <WatchlistButton fundCode={code} />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">NAV</p>
                        <p className="font-semibold">{nav !== null ? `₹${nav.toFixed(2)}` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-semibold text-sm">{category}</p>
                      </div>
                    </div>

                    {/* Returns not available in this API shape; can be added when backend provides */}

                    <div className="flex space-x-2 pt-2">
                      <Button asChild className="flex-1">
                        <Link href={`/scheme/${code}`} className="flex items-center space-x-2">
                          <span>View Details</span>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
          );})}
        </StaggerContainer>
      )}

      {/* Empty State */}
      {data && data.schemes && data.schemes.length === 0 && (
        <AnimatedWrapper animation="fadeInUp">
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No funds found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria
              </p>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <AnimatedWrapper animation="fadeInUp" delay={0.2}>
          <Card>
            <CardContent className="flex items-center justify-center py-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="hover-scale"
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(data.totalPages - 4, page - 2)) + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10 h-10 p-0 hover-scale"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === data.totalPages}
                  className="hover-scale"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      )}

      {/* Results Info */}
      {data && (
        <AnimatedWrapper animation="fadeIn">
          <div className="text-center text-sm text-muted-foreground">
            Showing {data.schemes?.length || 0} of {data.totalSchemes || 0} funds
            {searchQuery && ` for "${searchQuery}"`}
          </div>
        </AnimatedWrapper>
      )}
    </div>
  );
}