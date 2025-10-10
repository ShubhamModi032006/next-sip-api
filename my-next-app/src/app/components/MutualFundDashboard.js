// import { useState, useEffect } from 'react';
// import { 
//   Grid, 
//   Card, 
//   CardContent, 
//   Typography, 
//   Box, 
//   Chip,
//   CircularProgress,
//   Alert,
//   Tabs,
//   Tab
// } from '@mui/material';
// import { 
//   LineChart, 
//   Line, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip, 
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   Legend // <<<--- THIS LINE IS THE FIX
// } from 'recharts';
// import axios from 'axios';
// import dayjs from 'dayjs';

// const formatToIndianCurrency = (number) => {
//   const numericValue = Number(number);
//   if (isNaN(numericValue)) return '₹ 0';

//   const formatter = new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   });

//   return formatter.format(numericValue);
// };

// function TabPanel({ children, value, index }) {
//   return (
//     <div hidden={value !== index}>
//       {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
//     </div>
//   );
// }

// export default function MutualFundDashboard({ schemeCode }) {
//   const [dashboardData, setDashboardData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [tabValue, setTabValue] = useState(0);

//   useEffect(() => {
//     if (schemeCode) {
//       fetchDashboardData();
//     }
//   }, [schemeCode]);

//   const fetchDashboardData = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const [
//         schemeResponse,
//         returnsResponse,
//         rollingResponse,
//         alphaBetaResponse,
//         navAnalysisResponse
//       ] = await Promise.allSettled([
//         axios.get(`/api/scheme/${schemeCode}`),
//         axios.get(`/api/scheme/${schemeCode}/returns?period=1y`),
//         axios.get(`/api/scheme/${schemeCode}/rolling-returns?period=1y&window=1y`),
//         axios.get(`/api/scheme/${schemeCode}/alpha-beta?period=1y`),
//         axios.get(`/api/scheme/${schemeCode}/nav-analysis?analysis=all`)
//       ]);

//       const data = {
//         scheme: schemeResponse.status === 'fulfilled' ? schemeResponse.value.data : null,
//         returns: returnsResponse.status === 'fulfilled' ? returnsResponse.value.data : null,
//         rolling: rollingResponse.status === 'fulfilled' ? rollingResponse.value.data : null,
//         alphaBeta: alphaBetaResponse.status === 'fulfilled' ? alphaBetaResponse.value.data : null,
//         navAnalysis: navAnalysisResponse.status === 'fulfilled' ? navAnalysisResponse.value.data : null
//       };

//       setDashboardData(data);
//     } catch (err) {
//       console.error('Dashboard data fetch error:', err);
//       setError('Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTabChange = (event, newValue) => {
//     setTabValue(newValue);
//   };

//   if (loading) {
//     return (
//       <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
//         <CircularProgress size={60} />
//       </Box>
//     );
//   }

//   if (error || !dashboardData) {
//     return (
//       <Alert severity="error" sx={{ mt: 2 }}>
//         {error || 'Failed to load dashboard data'}
//       </Alert>
//     );
//   }

//   const { scheme, returns, rolling, alphaBeta, navAnalysis } = dashboardData;

//   // Prepare chart data
//   const navChartData = scheme?.data?.slice(0, 30).reverse().map(item => ({
//     date: dayjs(item.date, 'DD-MM-YYYY').format('MMM DD'),
//     nav: parseFloat(item.nav)
//   })) || [];

//   const rollingChartData = rolling?.rollingReturns?.slice(-12).map(item => ({
//     date: dayjs(item.date).format('MMM DD'),
//     return: item.annualizedReturn
//   })) || [];

//   const volatilityData = navAnalysis?.volatility?.returns?.slice(-20).map((ret, index) => ({
//     day: index + 1,
//     return: (ret * 100).toFixed(2)
//   })) || [];

//   return (
//     <Box sx={{ p: 3 }}>
//       <Typography variant="h4" gutterBottom>
//         Mutual Fund Dashboard
//       </Typography>
      
//       {/* Key Metrics Cards */}
//       <Grid container spacing={2} sx={{ mb: 3 }}>
//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Typography variant="h6" color="primary">
//                 {scheme?.data?.[0] ? `₹${parseFloat(scheme.data[0].nav).toFixed(4)}` : 'N/A'}
//               </Typography>
//               <Typography variant="body2" color="text.secondary">
//                 Current NAV
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
        
//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Typography variant="h6" color="success.main">
//                 {returns?.annualizedReturn ? `${returns.annualizedReturn.toFixed(2)}%` : 'N/A'}
//               </Typography>
//               <Typography variant="body2" color="text.secondary">
//                 1Y CAGR
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
        
//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Typography variant="h6" color="info.main">
//                 {rolling?.statistics?.average ? `${rolling.statistics.average.toFixed(2)}%` : 'N/A'}
//               </Typography>
//               <Typography variant="body2" color="text.secondary">
//                 Avg Rolling Return
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
        
//         <Grid item xs={12} sm={6} md={3}>
//           <Card>
//             <CardContent>
//               <Typography variant="h6" color="warning.main">
//                 {alphaBeta?.metrics?.beta ? alphaBeta.metrics.beta.toFixed(3) : 'N/A'}
//               </Typography>
//               <Typography variant="body2" color="text.secondary">
//                 Beta
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Tabs for different views */}
//       <Card>
//         <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
//           <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
//             <Tab label="Performance" />
//             <Tab label="Risk Analysis" />
//             <Tab label="Volatility" />
//             <Tab label="Trends" />
//           </Tabs>
//         </Box>

//         {/* Performance Tab */}
//         <TabPanel value={tabValue} index={0}>
//           <Grid container spacing={2}>
//             <Grid item xs={12} md={8}>
//               <Typography variant="h6" gutterBottom>NAV Performance (Last 30 Days)</Typography>
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart data={navChartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="date" />
//                   <YAxis />
//                   <Tooltip formatter={(value) => [`₹${value.toFixed(4)}`, 'NAV']} />
//                   <Line type="monotone" dataKey="nav" stroke="#1976d2" strokeWidth={2} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </Grid>
            
//             <Grid item xs={12} md={4}>
//               <Typography variant="h6" gutterBottom>Performance Summary</Typography>
//               {navAnalysis?.summary && (
//                 <Box>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Total Return:</strong> {navAnalysis.summary.totalReturn}%
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>CAGR:</strong> {navAnalysis.summary.cagr}%
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Investment Period:</strong> {navAnalysis.summary.totalYears} years
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Highest NAV:</strong> ₹{navAnalysis.summary.maxNav.toFixed(4)}
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Lowest NAV:</strong> ₹{navAnalysis.summary.minNav.toFixed(4)}
//                   </Typography>
//                 </Box>
//               )}
//             </Grid>
//           </Grid>
//         </TabPanel>

//         {/* Risk Analysis Tab */}
//         <TabPanel value={tabValue} index={1}>
//           <Grid container spacing={2}>
//             <Grid item xs={12} md={6}>
//               <Typography variant="h6" gutterBottom>Risk Metrics</Typography>
//               {alphaBeta?.metrics && (
//                 <Box>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Alpha:</strong> {alphaBeta.metrics.alpha} 
//                     <Chip 
//                       label={alphaBeta.metrics.alpha > 0 ? 'Positive' : 'Negative'} 
//                       color={alphaBeta.metrics.alpha > 0 ? 'success' : 'error'}
//                       size="small"
//                       sx={{ ml: 1 }}
//                     />
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Beta:</strong> {alphaBeta.metrics.beta}
//                     <Chip 
//                       label={alphaBeta.metrics.beta > 1 ? 'High Risk' : 'Low Risk'} 
//                       color={alphaBeta.metrics.beta > 1 ? 'warning' : 'success'}
//                       size="small"
//                       sx={{ ml: 1 }}
//                     />
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Sharpe Ratio:</strong> {alphaBeta.metrics.sharpeRatio}
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Correlation:</strong> {alphaBeta.metrics.correlation}
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>R-Squared:</strong> {(alphaBeta.metrics.rSquared * 100).toFixed(2)}%
//                   </Typography>
//                 </Box>
//               )}
//             </Grid>
            
//             <Grid item xs={12} md={6}>
//               <Typography variant="h6" gutterBottom>Risk Profile</Typography>
//               <ResponsiveContainer width="100%" height={300}>
//                 <PieChart>
//                   <Pie
//                     data={[
//                       { name: 'Systematic Risk', value: alphaBeta?.metrics?.beta || 0 },
//                       { name: 'Unsystematic Risk', value: 1 - (alphaBeta?.metrics?.beta || 0) }
//                     ]}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={60}
//                     outerRadius={100}
//                     paddingAngle={5}
//                     dataKey="value"
//                   >
//                     <Cell fill="#8884d8" />
//                     <Cell fill="#82ca9d" />
//                   </Pie>
//                   <Tooltip />
//                   <Legend />
//                 </PieChart>
//               </ResponsiveContainer>
//             </Grid>
//           </Grid>
//         </TabPanel>

//         {/* Volatility Tab */}
//         <TabPanel value={tabValue} index={2}>
//           <Grid container spacing={2}>
//             <Grid item xs={12} md={8}>
//               <Typography variant="h6" gutterBottom>Daily Returns Volatility</Typography>
//               <ResponsiveContainer width="100%" height={300}>
//                 <BarChart data={volatilityData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="day" />
//                   <YAxis />
//                   <Tooltip formatter={(value) => [`${value}%`, 'Daily Return']} />
//                   <Bar dataKey="return" fill="#8884d8" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </Grid>
            
//             <Grid item xs={12} md={4}>
//               <Typography variant="h6" gutterBottom>Volatility Metrics</Typography>
//               {navAnalysis?.volatility && (
//                 <Box>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Daily Volatility:</strong> {(navAnalysis.volatility.daily * 100).toFixed(4)}%
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Monthly Volatility:</strong> {navAnalysis.volatility.monthly.toFixed(2)}%
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Annualized Volatility:</strong> {navAnalysis.volatility.annualized.toFixed(2)}%
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Best Day:</strong> {(navAnalysis.volatility.maxDailyReturn * 100).toFixed(2)}%
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Worst Day:</strong> {(navAnalysis.volatility.minDailyReturn * 100).toFixed(2)}%
//                   </Typography>
//                 </Box>
//               )}
//             </Grid>
//           </Grid>
//         </TabPanel>

//         {/* Trends Tab */}
//         <TabPanel value={tabValue} index={3}>
//           <Grid container spacing={2}>
//             <Grid item xs={12} md={6}>
//               <Typography variant="h6" gutterBottom>Rolling Returns Trend</Typography>
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart data={rollingChartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="date" />
//                   <YAxis />
//                   <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Rolling Return']} />
//                   <Line type="monotone" dataKey="return" stroke="#82ca9d" strokeWidth={2} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </Grid>
            
//             <Grid item xs={12} md={6}>
//               <Typography variant="h6" gutterBottom>Trend Analysis</Typography>
//               {navAnalysis?.trends && (
//                 <Box>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Short Term (1M):</strong> {navAnalysis.trends.shortTerm?.totalReturn || 'N/A'}%
//                     <Chip 
//                       label={navAnalysis.trends.shortTerm?.trendDirection || 'N/A'} 
//                       color={navAnalysis.trends.shortTerm?.trendDirection === 'upward' ? 'success' : 'error'}
//                       size="small"
//                       sx={{ ml: 1 }}
//                     />
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Medium Term (3M):</strong> {navAnalysis.trends.mediumTerm?.totalReturn || 'N/A'}%
//                     <Chip 
//                       label={navAnalysis.trends.mediumTerm?.trendDirection || 'N/A'} 
//                       color={navAnalysis.trends.mediumTerm?.trendDirection === 'upward' ? 'success' : 'error'}
//                       size="small"
//                       sx={{ ml: 1 }}
//                     />
//                   </Typography>
//                   <Typography variant="body1" gutterBottom>
//                     <strong>Long Term (1Y):</strong> {navAnalysis.trends.longTerm?.totalReturn || 'N/A'}%
//                     <Chip 
//                       label={navAnalysis.trends.longTerm?.trendDirection || 'N/A'} 
//                       color={navAnalysis.trends.longTerm?.trendDirection === 'upward' ? 'success' : 'error'}
//                       size="small"
//                       sx={{ ml: 1 }}
//                     />
//                   </Typography>
//                 </Box>
//               )}
//             </Grid>
//           </Grid>
//         </TabPanel>
//       </Card>
//     </Box>
//   );
// }