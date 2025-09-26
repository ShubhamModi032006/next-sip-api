'use client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Container, Button, Box } from '@mui/material';
import Link from 'next/link';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import "./globals.css";

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>MutualFund Pro - Investment Calculator</title>
        <meta name="description" content="Comprehensive mutual fund analysis and SIP calculator" />
      </head>
      <body>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <CssBaseline />
            <AppBar position="static" elevation={2}>
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    MutualFund Pro
                  </Link>
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button color="inherit" component={Link} href="/">
                    Home
                  </Button>
                  <Button color="inherit" component={Link} href="/funds">
                    All Funds
                  </Button>
                  <Button color="inherit" component={Link} href="/portfolio">
                    Portfolio
                  </Button>
                </Box>
              </Toolbar>
            </AppBar>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
              {children}
            </Container>
          </LocalizationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
