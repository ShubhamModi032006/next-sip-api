'use client';
import { useState, useEffect } from 'react';
import {
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Paper
} from '@mui/material';
import { Search as SearchIcon, TrendingUp as TrendingUpIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function FundsPage() {
  const [funds, setFunds] = useState([]);
  const [filteredFunds, setFilteredFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFundHouse, setSelectedFundHouse] = useState('');
  const [categories, setCategories] = useState([]);
  const [fundHouses, setFundHouses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fundsPerPage] = useState(20);
  const router = useRouter();

  useEffect(() => {
    fetchFunds();
  }, []);

  useEffect(() => {
    filterFunds();
  }, [searchTerm, selectedCategory, selectedFundHouse, funds]);

  const fetchFunds = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/mf');
      setFunds(response.data);
      
      // Extract unique categories and fund houses
      const uniqueCategories = [...new Set(response.data.map(fund => fund.category))].filter(Boolean);
      const uniqueFundHouses = [...new Set(response.data.map(fund => fund.fundHouse))].filter(Boolean);
      
      setCategories(uniqueCategories.sort());
      setFundHouses(uniqueFundHouses.sort());
      
    } catch (err) {
      setError('Failed to fetch mutual funds data');
      console.error('Error fetching funds:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterFunds = () => {
    let filtered = funds;

    if (searchTerm) {
      filtered = filtered.filter(fund =>
        fund.schemeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.fundHouse?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(fund => fund.category === selectedCategory);
    }

    if (selectedFundHouse) {
      filtered = filtered.filter(fund => fund.fundHouse === selectedFundHouse);
    }

    setFilteredFunds(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleViewDetails = (schemeCode) => {
    router.push(`/scheme/${schemeCode}`);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedFundHouse('');
  };

  // Calculate pagination
  const indexOfLastFund = currentPage * fundsPerPage;
  const indexOfFirstFund = indexOfLastFund - fundsPerPage;
  const currentFunds = filteredFunds.slice(indexOfFirstFund, indexOfLastFund);
  const totalPages = Math.ceil(filteredFunds.length / fundsPerPage);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        All Mutual Funds
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Browse and analyze {funds.length.toLocaleString()} mutual funds with detailed performance metrics
      </Typography>

      {/* Advanced Search and Filter Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterListIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Search & Filter</Typography>
        </Box>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search funds or fund house"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Fund House</InputLabel>
              <Select
                value={selectedFundHouse}
                label="Fund House"
                onChange={(e) => setSelectedFundHouse(e.target.value)}
              >
                <MenuItem value="">All Fund Houses</MenuItem>
                {fundHouses.map((fundHouse) => (
                  <MenuItem key={fundHouse} value={fundHouse}>
                    {fundHouse}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              disabled={!searchTerm && !selectedCategory && !selectedFundHouse}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {indexOfFirstFund + 1}-{Math.min(indexOfLastFund, filteredFunds.length)} of {filteredFunds.length} funds
          </Typography>
          
          {(searchTerm || selectedCategory || selectedFundHouse) && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {searchTerm && (
                <Chip 
                  label={`Search: ${searchTerm}`} 
                  onDelete={() => setSearchTerm('')} 
                  size="small" 
                />
              )}
              {selectedCategory && (
                <Chip 
                  label={`Category: ${selectedCategory}`} 
                  onDelete={() => setSelectedCategory('')} 
                  size="small" 
                />
              )}
              {selectedFundHouse && (
                <Chip 
                  label={`Fund House: ${selectedFundHouse}`} 
                  onDelete={() => setSelectedFundHouse('')} 
                  size="small" 
                />
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Funds Grid */}
      <Grid container spacing={3}>
        {currentFunds.map((fund) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={fund.schemeCode}>
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography 
                  variant="h6" 
                  component="h2" 
                  gutterBottom
                  sx={{
                    fontSize: '1rem',
                    lineHeight: 1.3,
                    height: '2.6rem',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {fund.schemeName}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {fund.fundHouse}
                </Typography>
                
                {fund.category && (
                  <Chip 
                    label={fund.category} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                )}
                
                <Typography variant="caption" display="block" color="text.secondary">
                  Code: {fund.schemeCode}
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<TrendingUpIcon />}
                  onClick={() => handleViewDetails(fund.schemeCode)}
                  fullWidth
                >
                  Analyze Fund
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {filteredFunds.length === 0 && !loading && (
        <Box textAlign="center" sx={{ mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No funds found matching your criteria
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search terms or filters
          </Typography>
          <Button variant="outlined" onClick={clearFilters} sx={{ mt: 2 }}>
            Clear All Filters
          </Button>
        </Box>
      )}
    </Box>
  );
}
