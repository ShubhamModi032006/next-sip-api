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
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Search as SearchIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Home() {
  const [funds, setFunds] = useState([]);
  const [filteredFunds, setFilteredFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchFunds();
  }, []);

  useEffect(() => {
    filterFunds();
  }, [searchTerm, selectedCategory, funds]);

  const fetchFunds = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/mf');
      setFunds(response.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(fund => fund.category))].filter(Boolean);
      setCategories(uniqueCategories);
      
      setFilteredFunds(response.data.slice(0, 50)); // Show first 50 initially
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
        fund.schemeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.fundHouse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(fund => fund.category === selectedCategory);
    }

    setFilteredFunds(filtered.slice(0, 100)); // Limit to 100 results
  };

  const handleViewDetails = (schemeCode) => {
    router.push(`/scheme/${schemeCode}`);
  };

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
        Mutual Fund Explorer
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Discover and analyze mutual funds with comprehensive SIP calculators
      </Typography>

      {/* Search and Filter Section */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredFunds.length} funds found
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Funds Grid */}
      <Grid container spacing={3}>
        {filteredFunds.map((fund) => (
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

      {filteredFunds.length === 0 && !loading && (
        <Box textAlign="center" sx={{ mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No funds found matching your criteria
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search terms or category filter
          </Typography>
        </Box>
      )}
    </Box>
  );
}
