'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedWrapper, HoverCard, StaggerContainer, StaggerItem } from '@/components/ui/animated-wrapper';
import { TrendingUp, Calculator, BarChart3, Star, ArrowRight, Sparkles, Users, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Calculator,
      title: 'Smart Calculators',
      description: 'Lumpsum, SIP, SWP, and more investment calculators',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      icon: BarChart3,
      title: 'Portfolio Tracking',
      description: 'Track your investments with detailed analytics',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Market Analysis',
      description: 'Compare funds and make informed decisions',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    },
    {
      icon: Star,
      title: 'Watchlist',
      description: 'Save and monitor your favorite funds',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600'
    }
  ];

  const roleFeatures = [
    {
      icon: Users,
      title: 'Company Head',
      description: 'Complete system oversight and admin management',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
    },
    {
      icon: Shield,
      title: 'Admin',
      description: 'Manage sellers and view comprehensive team data',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      icon: TrendingUp,
      title: 'Seller',
      description: 'Manage customers and track your commissions',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      icon: Zap,
      title: 'Customer',
      description: 'Manage your portfolio and SIP investments',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative container mx-auto px-4 py-20">
          <StaggerContainer className="text-center">
            <StaggerItem>
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
                <Sparkles className="h-4 w-4" />
                <span>Comprehensive Mutual Fund Platform</span>
              </div>
            </StaggerItem>
            
            <StaggerItem>
              <h1 className="text-6xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Mutual Fund
                </span>
                <br />
                <span className="text-gray-800">Portal</span>
              </h1>
            </StaggerItem>
            
            <StaggerItem>
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Complete mutual fund management platform with role-based access. 
                Plan investments, track portfolios, and manage your financial future.
              </p>
            </StaggerItem>
            
            <StaggerItem>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <HoverCard>
                  <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    <Link href="/register" className="flex items-center space-x-2">
                      <span>Get Started</span>
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </HoverCard>
                
                <HoverCard>
                  <Button variant="outline" size="lg" asChild className="px-8 py-4 text-lg font-semibold hover:shadow-lg transition-all duration-300">
                    <Link href="/login" className="flex items-center space-x-2">
                      <span>Sign In</span>
                    </Link>
                  </Button>
                </HoverCard>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <AnimatedWrapper animation="fadeInUp" className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Everything you need for smart investing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful tools and insights to help you make informed investment decisions
          </p>
        </AnimatedWrapper>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <HoverCard className="h-full">
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Role-Based Access Section */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <AnimatedWrapper animation="fadeInUp" className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Role-Based Access Control
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Different dashboards and features based on your role in the organization
            </p>
          </AnimatedWrapper>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roleFeatures.map((feature, index) => (
              <StaggerItem key={index}>
                <HoverCard className="h-full">
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                    <CardContent className="p-8 text-center">
                      <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <AnimatedWrapper animation="fadeInUp">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to start your investment journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join our comprehensive mutual fund platform and take control of your financial future
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <HoverCard>
                <Button size="lg" variant="secondary" asChild className="px-8 py-4 text-lg font-semibold hover:shadow-lg transition-all duration-300">
                  <Link href="/register" className="flex items-center space-x-2">
                    <span>Create Account</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </HoverCard>
              
              <HoverCard>
                <Button size="lg" variant="outline" asChild className="px-8 py-4 text-lg font-semibold hover:shadow-lg transition-all duration-300 border-white text-white hover:bg-white hover:text-blue-600">
                  <Link href="/login" className="flex items-center space-x-2">
                    <span>Sign In</span>
                  </Link>
                </Button>
              </HoverCard>
            </div>
          </AnimatedWrapper>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <AnimatedWrapper animation="fadeIn">
            <p className="text-gray-400">
              Powered by advanced analytics and modern technology
            </p>
            <p className="text-gray-500 mt-2 text-sm">
              © 2024 Mutual Fund Portal. All rights reserved.
            </p>
          </AnimatedWrapper>
        </div>
      </footer>
    </div>
  );
}
