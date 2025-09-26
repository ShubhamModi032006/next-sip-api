"use client";

import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import Link from "next/link";

export default function Navbar() {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        {/* App Title */}
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: "bold" }}
        >
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            MF Tracker
          </Link>
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            component={Link}
            href="/"
            color="inherit"
          >
            Home
          </Button>
          <Button
            component={Link}
            href="/scheme/100027"
            color="inherit"
          >
            Sample Scheme
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
