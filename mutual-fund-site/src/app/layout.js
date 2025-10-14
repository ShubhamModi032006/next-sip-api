'use client'; // The Navbar needs to be a client component to use the context hooks

import './globals.css';
import { Inter } from 'next/font/google';
import { CompareProvider, useCompare } from '@/context/CompareContext';
import { WatchlistProvider, useWatchlist } from '@/context/WatchlistContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedWrapper, HoverCard } from '@/components/ui/animated-wrapper';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { GitCompareArrows, Star, Menu, X } from 'lucide-react';
import { useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

// This is the Navigation Bar component, now built directly inside the layout file.
function SiteNavbar() {
  const { compareList } = useCompare();
  const { watchlist } = useWatchlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <AnimatedWrapper animation="fadeIn" className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <AnimatedWrapper animation="slideInFromLeft" delay={0.1}>
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
            >
              <span className="gradient-blue bg-clip-text text-transparent">Fund Explorer</span>
            </Link>
          </AnimatedWrapper>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <AnimatedWrapper animation="fadeInUp" delay={0.2}>
              <Button variant="ghost" asChild>
                <Link href="/funds" className="hover-lift">
                  All Funds
                </Link>
              </Button>
            </AnimatedWrapper>

            <AnimatedWrapper animation="fadeInUp" delay={0.3}>
              <Button variant="ghost" asChild>
                <Link href="/virtual-portfolio" className="hover-lift">
                  Portfolio
                </Link>
              </Button>
            </AnimatedWrapper>

            <AnimatedWrapper animation="fadeInUp" delay={0.4}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" asChild>
                      <Link href="/compare" className="hover-lift flex items-center space-x-2">
                        <GitCompareArrows className="h-4 w-4" />
                        <span>Compare</span>
                        {compareList.length > 0 && (
                          <Badge variant="destructive" className="ml-1">
                            {compareList.length}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Compare mutual funds</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </AnimatedWrapper>
            
            <AnimatedWrapper animation="fadeInUp" delay={0.5}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" asChild>
                      <Link href="/watchlist" className="hover-lift flex items-center space-x-2">
                        <Star className="h-4 w-4" />
                        <span>Watchlist</span>
                        {watchlist.length > 0 && (
                          <Badge variant="destructive" className="ml-1">
                            {watchlist.length}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your saved funds</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </AnimatedWrapper>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hover-scale"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <AnimatedWrapper animation="fadeIn" className="md:hidden border-t">
            <div className="flex flex-col space-y-2 py-4">
              <Button variant="ghost" asChild className="justify-start">
                <Link href="/funds">All Funds</Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link href="/virtual-portfolio">Portfolio</Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link href="/compare" className="flex items-center space-x-2">
                  <GitCompareArrows className="h-4 w-4" />
                  <span>Compare</span>
                  {compareList.length > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {compareList.length}
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link href="/watchlist" className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Watchlist</span>
                  {watchlist.length > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {watchlist.length}
                    </Badge>
                  )}
                </Link>
              </Button>
            </div>
          </AnimatedWrapper>
        )}
      </div>
    </AnimatedWrapper>
  );
}


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TooltipProvider>
          <CompareProvider>
            <WatchlistProvider>
              <SiteNavbar />
              <main className="container mx-auto px-4 py-8">
                <AnimatedWrapper animation="fadeInUp" delay={0.2}>
                  {children}
                </AnimatedWrapper>
              </main>
            </WatchlistProvider>
          </CompareProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}

