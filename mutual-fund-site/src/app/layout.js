'use client'; // The Navbar needs to be a client component to use the context hooks

import './globals.css';
import { Inter } from 'next/font/google';
import ThemeRegistry from '@/components/ThemeRegistry';
import { CompareProvider, useCompare } from '@/context/CompareContext';
import { WatchlistProvider, useWatchlist } from '@/context/WatchlistContext';
import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button, Badge, Container } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';

const inter = Inter({ subsets: ['latin'] });

// This is the Navigation Bar component, now built directly inside the layout file.
function SiteNavbar() {
  const { compareList } = useCompare();
  const { watchlist } = useWatchlist();

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6" component={Link} href="/"
            sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}
          >
            Fund Explorer
          </Typography>
          
          <Button color="inherit" component={Link} href="/funds">
            All Funds
          </Button>

          {/* Virtual Portfolio Link Added Here */}
          <Button color="inherit" component={Link} href="/virtual-portfolio">
             Portfolio
          </Button>

          <Button
            color="inherit" component={Link} href="/compare"
            startIcon={
              <Badge badgeContent={compareList.length} color="secondary">
                <CompareArrowsIcon />
              </Badge>
            }
          >
            Compare
          </Button>
          
          <Button
            color="inherit"
            component={Link}
            href="/watchlist"
            startIcon={
              <Badge badgeContent={watchlist.length} color="secondary">
                <StarBorderRoundedIcon />
              </Badge>
            }
          >
            Watchlist
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ backgroundColor: '#f4f6f8' }}>
        <CompareProvider>
          <WatchlistProvider>
            <ThemeRegistry>
              <SiteNavbar /> {/* The Navbar is now here */}
              {/* Added Container for consistent page padding */}
              <Container component="main" sx={{ mt: 4, mb: 4 }}>
                {children}
              </Container>
            </ThemeRegistry>
          </WatchlistProvider>
        </CompareProvider>
      </body>
    </html>
  );
}

