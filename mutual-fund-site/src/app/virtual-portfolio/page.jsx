'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AnimatedWrapper, HoverCard, StaggerContainer, StaggerItem } from '@/components/ui/animated-wrapper';
import { Plus, Trash2, Edit, TrendingUp, TrendingDown, PieChart, BarChart3, Calendar, DollarSign } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const DUMMY_USERNAME = 'testuser123';

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState([]);
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    fundCode: '',
    schemeName: '',
    nav: '',
    amount: '',
    date: dayjs().format('YYYY-MM-DD')
  });

  const fetchPortfolio = useCallback(async () => {
    try {
      const response = await axios.get(`/api/virtual-portfolio?username=${DUMMY_USERNAME}`);
      setPortfolio(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  }, []);

  const fetchFunds = useCallback(async () => {
    try {
      const response = await axios.get('/api/mf?status=active');
      setFunds(response.data.schemes || []);
    } catch (error) {
      console.error('Error fetching funds:', error);
      setFunds([]);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
    setLoading(true);
      await Promise.all([fetchPortfolio(), fetchFunds()]);
      setLoading(false);
    };
    loadData();
  }, [fetchPortfolio, fetchFunds]);

  const handleAddEntry = async () => {
    try {
      // Single validation check for all required fields
      if (!newEntry.fundCode || !newEntry.amount || !newEntry.date || !newEntry.schemeName || !newEntry.nav) {
        alert('Please fill in all required fields');
        return;
      }

      const nav = parseFloat(newEntry.nav);
      if (isNaN(nav) || nav <= 0) {
        alert('Please enter a valid NAV value');
        return;
      }

      const amount = parseFloat(newEntry.amount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      const units = amount / nav;

      await axios.post('/api/virtual-portfolio', {
        username: DUMMY_USERNAME,
        schemeCode: newEntry.fundCode,
        schemeName: newEntry.schemeName,
        units: units,
        avgPrice: nav,
        investmentDate: new Date(newEntry.date).toISOString()
      });
      await fetchPortfolio();
      // Reset form with all fields
      setNewEntry({
        fundCode: '',
        schemeName: '',
        nav: '',
        amount: '',
        date: dayjs().format('YYYY-MM-DD')
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };

  const handleEditEntry = async () => {
    try {
      await axios.put(`/api/virtual-portfolio/${editingEntry._id}`, {
        ...editingEntry,
        amount: parseFloat(editingEntry.amount)
      });
      await fetchPortfolio();
      setEditingEntry(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const handleDeleteEntry = async (id) => {
      try {
      await axios.delete(`/api/virtual-portfolio/${id}`);
      await fetchPortfolio();
      } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const getFundName = (fundCode) => {
    if (!fundCode) return 'Unknown Fund';
    const fund = funds.find(f => f.code?.toString() === fundCode?.toString());
    return fund ? fund.name : `Fund ${fundCode}`;
  };

  const getFundNAV = (fundCode) => {
    if (!fundCode) return 0;
    const fund = funds.find(f => f.code?.toString() === fundCode?.toString());
    return fund ? parseFloat(fund.nav) || 0 : 0;
  };

  const calculateEntryValue = (entry) => {
    if (!entry) return 0;
    const currentNav = getFundNAV(entry.schemeCode);
    return entry.units * (currentNav || entry.avgPrice);
  };

  const calculateTotalValue = () => {
    return portfolio.reduce((total, entry) => {
      const currentValue = calculateEntryValue(entry);
      return total + currentValue;
    }, 0);
  };

  const calculateTotalGainLoss = () => {
    return portfolio.reduce((total, entry) => {
      const currentValue = calculateEntryValue(entry);
      const investedValue = entry.units * entry.avgPrice;
      return total + (currentValue - investedValue);
    }, 0);
  };

  const getPieChartData = () => {
    return portfolio.map((entry, index) => ({
      name: entry.schemeName || getFundName(entry.schemeCode),
      value: calculateEntryValue(entry),
      color: COLORS[index % COLORS.length]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnimatedWrapper animation="fadeInUp">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Virtual Portfolio</h1>
          <p className="text-xl text-gray-600">Track your mutual fund investments</p>
        </div>
      </AnimatedWrapper>

      {/* Summary Cards */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StaggerItem>
          <HoverCard>
            <Card className="hover-lift">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-600">
                  ₹{calculateTotalValue().toLocaleString()}
                </h3>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>

        <StaggerItem>
          <HoverCard>
            <Card className="hover-lift">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  {calculateTotalGainLoss() >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <h3 className={`text-2xl font-bold ${calculateTotalGainLoss() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{calculateTotalGainLoss().toLocaleString()}
                </h3>
                <p className="text-sm text-muted-foreground">Gain/Loss</p>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>

        <StaggerItem>
          <HoverCard>
            <Card className="hover-lift">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <PieChart className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-blue-600">
                  {portfolio.length}
                </h3>
                <p className="text-sm text-muted-foreground">Funds</p>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>
      </StaggerContainer>

      {/* Charts */}
      {portfolio.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatedWrapper animation="fadeInUp" delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Portfolio Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </AnimatedWrapper>

          <AnimatedWrapper animation="fadeInUp" delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Performance Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio.map((entry, index) => {
                    const gainLoss = (entry.currentValue || entry.amount) - entry.amount;
                    const percentage = ((gainLoss / entry.amount) * 100).toFixed(2);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{getFundName(entry.fundCode)}</h4>
                          <p className="text-sm text-muted-foreground">
                            Invested: ₹{entry.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {gainLoss >= 0 ? '+' : ''}₹{gainLoss.toLocaleString()}
                          </p>
                          <p className={`text-sm ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {percentage}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>
        </div>
      )}

      {/* Add Entry Button */}
      <AnimatedWrapper animation="fadeInUp" delay={0.4}>
        <div className="flex justify-center">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-5 w-5 mr-2" />
                Add Investment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Investment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Fund</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newEntry.fundCode}
                    onChange={(e) => {
                      const selectedFund = funds.schemes?.find(f => f.code.toString() === e.target.value);
                      if (selectedFund) {
                        setNewEntry({
                          ...newEntry,
                          fundCode: selectedFund.code.toString(),
                          schemeName: selectedFund.name,
                          nav: selectedFund.nav || ''
                        });
                      }
                    }}
                  >
                    <option value="">Select a fund</option>
                    {funds.map(fund => (
                      <option key={fund.code} value={fund.code}>
                        {fund.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">NAV</label>
                  <Input
                    type="number"
                    value={newEntry.nav}
                    readOnly
                    className="bg-gray-50"
                    placeholder="NAV will be set automatically"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddEntry} className="w-full">
                  Add Investment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedWrapper>

      {/* Portfolio Table */}
      {portfolio.length > 0 ? (
        <AnimatedWrapper animation="fadeInUp" delay={0.5}>
          <Card>
            <CardHeader>
              <CardTitle>Your Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fund</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Gain/Loss</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.map((entry, index) => {
                    const currentValue = calculateEntryValue(entry);
                    const investedValue = entry.units * entry.avgPrice;
                    const gainLoss = currentValue - investedValue;
                    const percentage = ((gainLoss / investedValue) * 100).toFixed(2);
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {entry.schemeName || getFundName(entry.schemeCode)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>₹{investedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                            <div className="text-sm text-gray-500">
                              {entry.units.toFixed(3)} units @ ₹{entry.avgPrice.toFixed(2)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>₹{currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className={gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {gainLoss >= 0 ? '+' : ''}₹{gainLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                            <Badge variant={gainLoss >= 0 ? 'default' : 'destructive'}>
                              {percentage}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{dayjs(entry.investmentDate).format('MMM DD, YYYY')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingEntry(entry);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEntry(entry._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      ) : (
        <AnimatedWrapper animation="fadeInUp">
          <Card>
            <CardContent className="text-center py-12">
              <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your portfolio by adding your first investment
              </p>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Investment</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Fund Code</label>
                <Input
                  value={editingEntry.fundCode}
                  onChange={(e) => setEditingEntry({ ...editingEntry, fundCode: e.target.value })}
                  placeholder="Enter fund code"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  value={editingEntry.amount}
                  onChange={(e) => setEditingEntry({ ...editingEntry, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Current Value</label>
                <Input
                  type="number"
                  value={editingEntry.currentValue || editingEntry.amount}
                  onChange={(e) => setEditingEntry({ ...editingEntry, currentValue: e.target.value })}
                  placeholder="Enter current value"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={editingEntry.date}
                  onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                />
              </div>
              <Button onClick={handleEditEntry} className="w-full">
                Update Investment
              </Button>
            </div>
          )}
          </DialogContent>
        </Dialog>
    </div>
  );
}