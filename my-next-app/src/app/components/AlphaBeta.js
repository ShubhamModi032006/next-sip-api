import { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Grid, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Chip,
  Alert
} from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function AlphaBeta({ schemeCode }) {
  const [period, setPeriod] = useState('1y');
  const [benchmark, setBenchmark] = useState('nifty50');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAlphaBeta = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await axios.get(`/api/scheme/${schemeCode}/alpha-beta?period=${period}&benchmark=${benchmark}`);
      setResult(response.data);
    } catch (err) {
      console.error('Alpha-Beta fetch failed:', err);
      setError(err.response?.data?.error || 'Failed to fetch alpha-beta metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schemeCode) {
      fetchAlphaBeta();
    }
  }, [schemeCode, period, benchmark]);

  const formatRadarData = (metrics) => {
    return [
      {
        metric: 'Alpha',
        value: Math.abs(metrics.alpha),
        fullMark: 5
      },
      {
        metric: 'Beta',
        value: Math.abs(metrics.beta),
        fullMark: 2
      },
      {
        metric: 'Correlation',
        value: Math.abs(metrics.correlation) * 100,
        fullMark: 100
      },
      {
        metric: 'R-Squared',
        value: Math.abs(metrics.rSquared) * 100,
        fullMark: 100
      },
      {
        metric: 'Sharpe Ratio',
        value: Math.abs(metrics.sharpeRatio),
        fullMark: 2
      }
    ];
  };

  const getAlphaInterpretation = (alpha) => {
    if (alpha > 2) return { text: 'Excellent', color: 'success' };
    if (alpha > 1) return { text: 'Good', color: 'info' };
    if (alpha > 0) return { text: 'Positive', color: 'warning' };
    return { text: 'Negative', color: 'error' };
  };

  const getBetaInterpretation = (beta) => {
    if (beta > 1.2) return { text: 'High Risk', color: 'error' };
    if (beta > 0.8) return { text: 'Moderate Risk', color: 'warning' };
    if (beta > 0.5) return { text: 'Low Risk', color: 'info' };
    return { text: 'Very Low Risk', color: 'success' };
  };

  const getSharpeInterpretation = (sharpe) => {
    if (sharpe > 1.5) return { text: 'Excellent', color: 'success' };
    if (sharpe > 1) return { text: 'Good', color: 'info' };
    if (sharpe > 0.5) return { text: 'Fair', color: 'warning' };
    return { text: 'Poor', color: 'error' };
  };

  return (
    <Box sx={{ p: 3, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Alpha & Beta Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Analyze fund's risk-adjusted returns and market sensitivity
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Analysis Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="1y">1 Year</option>
            <option value="3y">3 Years</option>
            <option value="5y">5 Years</option>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Benchmark"
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value)}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="nifty50">Nifty 50</option>
            <option value="sensex">Sensex</option>
            <option value="nifty500">Nifty 500</option>
          </TextField>
        </Grid>
      </Grid>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error: {error}
        </Typography>
      )}

      {result && !error && (
        <Box>
          {/* Key Metrics Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {result.metrics.alpha.toFixed(4)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Alpha
                  </Typography>
                  <Chip 
                    label={getAlphaInterpretation(result.metrics.alpha).text}
                    color={getAlphaInterpretation(result.metrics.alpha).color}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {result.metrics.beta.toFixed(4)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Beta
                  </Typography>
                  <Chip 
                    label={getBetaInterpretation(result.metrics.beta).text}
                    color={getBetaInterpretation(result.metrics.beta).color}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {result.metrics.sharpeRatio.toFixed(4)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sharpe Ratio
                  </Typography>
                  <Chip 
                    label={getSharpeInterpretation(result.metrics.sharpeRatio).text}
                    color={getSharpeInterpretation(result.metrics.sharpeRatio).color}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Radar Chart */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk-Return Profile
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={formatRadarData(result.metrics)}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Fund Metrics" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Risk Metrics
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Alpha
                    </Typography>
                    <Typography variant="h6">
                      {result.metrics.alpha.toFixed(4)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Excess return over expected return based on beta
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Beta
                    </Typography>
                    <Typography variant="h6">
                      {result.metrics.beta.toFixed(4)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sensitivity to market movements
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Correlation
                    </Typography>
                    <Typography variant="h6">
                      {result.metrics.correlation.toFixed(4)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Correlation with benchmark
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      R-Squared
                    </Typography>
                    <Typography variant="h6">
                      {(result.metrics.rSquared * 100).toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Percentage of variance explained by benchmark
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Return Metrics
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Fund Average Return
                    </Typography>
                    <Typography variant="h6">
                      {result.metrics.schemeMeanReturn.toFixed(4)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly average return
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Benchmark Average Return
                    </Typography>
                    <Typography variant="h6">
                      {result.metrics.benchmarkMeanReturn.toFixed(4)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly average return
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Fund Volatility
                    </Typography>
                    <Typography variant="h6">
                      {result.metrics.schemeVolatility.toFixed(4)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Standard deviation of returns
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Benchmark Volatility
                    </Typography>
                    <Typography variant="h6">
                      {result.metrics.benchmarkVolatility.toFixed(4)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Standard deviation of returns
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Analysis Summary */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Summary
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> {result.note}
                </Typography>
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Data Points Analyzed: {result.dataPoints}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Analysis Period: {period}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Benchmark: {benchmark}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
