'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import WatchlistButton from './WatchlistButton';

export default function FundsList() {
  const [activeTab, setActiveTab] = useState('all');
  const [funds, setFunds] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({
    totalPages: 0,
    totalSchemes: 0,
    summary: { totalActive: 0, totalInactive: 0 }
  });

  const fetchFunds = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mf?status=${activeTab}&page=${page}&limit=12`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch funds');
      
      setFunds(data.schemes);
      setMeta({
        totalPages: data.totalPages,
        totalSchemes: data.totalSchemes,
        summary: data.summary
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [page, activeTab]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setPage(1); // Reset to first page when changing tabs
  };

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">
              All Funds
              <Badge variant="secondary" className="ml-2">
                {meta.summary.totalActive + meta.summary.totalInactive}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              <Badge variant="secondary" className="ml-2">
                {meta.summary.totalActive}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inactive
              <Badge variant="secondary" className="ml-2">
                {meta.summary.totalInactive}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-6">
          <FundsGrid funds={funds} loading={loading} />
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          <FundsGrid funds={funds} loading={loading} />
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-6">
          <FundsGrid funds={funds} loading={loading} />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-6">
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setPage(p => p + 1)}
          disabled={page >= meta.totalPages || loading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function FundsGrid({ funds, loading }) {
  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </Card>
      ))}
    </div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {funds.map((fund) => (
        <div key={fund.code} className="relative group">
          <Link 
            href={`/scheme/${fund.code}`}
            className="transition-transform hover:scale-105 block"
          >
            <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow">
              <h3 className="font-semibold mb-2">{fund.name}</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Code: {fund.code}</p>
                  {fund.nav && (
                    <p className="text-sm">NAV: ₹{fund.nav}</p>
                  )}
                </div>
                <Badge variant={fund.status === 'active' ? 'default' : 'secondary'}>
                  {fund.status || 'active'}
                </Badge>
              </div>
            </Card>
          </Link>
          <div className="absolute top-2 right-2 z-10">
            <WatchlistButton
              scheme={{
                schemeCode: fund.code,
                schemeName: fund.name
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}