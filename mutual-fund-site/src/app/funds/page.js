'use client'; // This is a client component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Container,
  Grid,
  Typography,
  CircularProgress,
  Box,
  Pagination,
  TextField,
  Paper,
} from '@mui/material';
// --- NEW: Import the WatchlistButton component ---
import WatchlistButton from '@/components/WatchlistButton';

export default function FundsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

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
  }, [page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  return (
    <Container sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search by scheme name..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
        />
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {data?.schemes?.map((scheme) => (
              // --- EDITED: This is the new card structure using Tailwind CSS ---
              <Grid item key={scheme.schemeCode} xs={12} sm={6} md={4}>
                <Link href={`/scheme/${scheme.schemeCode}`} className="no-underline h-full flex">
                  <div className="bg-white w-full h-full rounded-lg shadow-md p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <Typography
                          variant="h6"
                          component="h3"
                          className="font-semibold text-gray-800 pr-2"
                          sx={{
                            // Truncate long fund names
                            display: '-webkit-box',
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 3,
                          }}
                        >
                          {scheme.schemeName}
                        </Typography>
                        {/* The WatchlistButton is now here */}
                        <WatchlistButton schemeCode={scheme.schemeCode} />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Scheme Code: {scheme.schemeCode}
                    </p>
                  </div>
                </Link>
              </Grid>
            ))}
          </Grid>
          
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={data?.totalPages || 0}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}
    </Container>
  );
}

