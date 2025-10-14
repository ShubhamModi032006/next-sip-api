'use client';

import { React, useState, useEffect } from 'react';
import { useCompare } from '@/context/CompareContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AnimatedWrapper, HoverCard, StaggerContainer, StaggerItem } from '@/components/ui/animated-wrapper';
import { Search, X, TrendingUp, TrendingDown, BarChart3, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ComparePage() {
  const { compareList, addToCompare, removeFromCompare } = useCompare();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  // Effect for handling the autocomplete search
  useEffect(() => {
    if (searchValue.length < 3) {
      setSearchOptions([]);
      return;
    }
    const handler = setTimeout(() => {
      fetch(`/api/mf?q=${searchValue}&limit=10`)
        .then(res => res.json())
        .then(data => setSearchOptions(data.schemes || []));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchValue]);

  // Main data fetching and processing effect
  useEffect(() => {
    if (compareList.length === 0) {
      setCompareData(null);
      setChartData([]);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchCompareData = async () => {
      try {
        const promises = compareList.map(code => 
          fetch(`/api/scheme/${code}/returns`).then(res => res.json())
        );
        
        const results = await Promise.all(promises);
        
        const processedData = results.map((data, index) => ({
          code: compareList[index],
          name: data.scheme?.name || `Fund ${compareList[index]}`,
          returns: data.returns || {},
          nav: data.scheme?.nav || 0
        }));

        setCompareData(processedData);

        // Process chart data
        const chartDataMap = new Map();
        
        processedData.forEach((fund, fundIndex) => {
          Object.entries(fund.returns).forEach(([period, returnValue]) => {
            if (!chartDataMap.has(period)) {
              chartDataMap.set(period, { period });
            }
            chartDataMap.get(period)[`fund${fundIndex + 1}`] = returnValue;
            chartDataMap.get(period)[`fund${fundIndex + 1}Name`] = fund.name;
          });
        });

        setChartData(Array.from(chartDataMap.values()));
      } catch (err) {
        setError('Failed to fetch comparison data');
        console.error('Error fetching compare data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompareData();
  }, [compareList]);

  const handleAddToCompare = (fund) => {
    addToCompare(fund.code);
    setSearchValue('');
    setSearchOptions([]);
  };

  const handleRemoveFromCompare = (code) => {
    removeFromCompare(code);
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Compare Funds</h1>
          <p className="text-xl text-gray-600">Compare performance of multiple mutual funds</p>
        </div>
      </AnimatedWrapper>

      {/* Search Section */}
      <AnimatedWrapper animation="fadeInUp" delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Add Funds to Compare</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Search for funds to compare..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              {searchOptions.length > 0 && (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {searchOptions.map((option) => (
                    <div
                      key={option.code}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleAddToCompare(option)}
                    >
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-muted-foreground">Code: {option.code}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </AnimatedWrapper>

      {/* Selected Funds */}
      {compareList.length > 0 && (
        <AnimatedWrapper animation="fadeInUp" delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Selected Funds ({compareList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {compareList.map((code, index) => (
                  <Badge
                    key={code}
                    variant="secondary"
                    className="px-3 py-1 text-sm flex items-center space-x-2"
                  >
                    <span>Fund {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromCompare(code)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      )}

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

      {/* Error State */}
      {error && (
        <AnimatedWrapper animation="fadeIn">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center space-x-2 py-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-600">{error}</span>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      )}

      {/* Comparison Results */}
      {compareData && compareData.length > 0 && (
        <div className="space-y-8">
          {/* Performance Chart */}
          <AnimatedWrapper animation="fadeInUp" delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Performance Comparison</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {compareData.map((_, index) => (
                      <Line
                        key={index}
                        type="monotone"
                        dataKey={`fund${index + 1}`}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        name={`Fund ${index + 1}`}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </AnimatedWrapper>

          {/* Returns Table */}
          <AnimatedWrapper animation="fadeInUp" delay={0.4}>
            <Card>
              <CardHeader>
                <CardTitle>Returns Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      {compareData.map((fund, index) => (
                        <TableHead key={index} className="text-center">
                          Fund {index + 1}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(compareData[0]?.returns || {}).map((period) => (
                      <TableRow key={period}>
                        <TableCell className="font-medium">{period}</TableCell>
                        {compareData.map((fund, index) => {
                          const returnValue = fund.returns[period] || 0;
                          return (
                            <TableCell key={index} className="text-center">
                              <div className="flex items-center justify-center space-x-2">
                                {getReturnIcon(returnValue)}
                                <span className={getReturnColor(returnValue)}>
                                  {returnValue.toFixed(2)}%
                                </span>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </AnimatedWrapper>

          {/* Fund Details */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {compareData.map((fund, index) => (
              <StaggerItem key={fund.code}>
                <HoverCard>
                  <Card className="hover-lift">
                    <CardHeader>
                      <CardTitle className="text-lg">Fund {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground">Name</h4>
                          <p className="text-sm">{fund.name}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground">Code</h4>
                          <p className="text-sm font-mono">{fund.code}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground">NAV</h4>
                          <p className="text-sm">₹{fund.nav.toFixed(2)}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFromCompare(fund.code)}
                          className="w-full"
                        >
                          Remove from Compare
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}

      {/* Empty State */}
      {compareList.length === 0 && !loading && (
        <AnimatedWrapper animation="fadeInUp">
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No funds selected</h3>
              <p className="text-muted-foreground mb-4">
                Search and add funds above to start comparing
              </p>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      )}
    </div>
  );
}