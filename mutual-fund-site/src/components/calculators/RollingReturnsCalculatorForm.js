import { Stack, Typography, Slider } from '@mui/material';

export default function RollingReturnsCalculatorForm({ state, onStateChange }) {
  return (
    <Stack spacing={2.5}>
      <Typography variant="h6">Rolling Returns Calculator</Typography>
      <Typography gutterBottom>Return Period: <strong>{state.periodYears} Year(s)</strong></Typography>
      <Slider
        value={state.periodYears}
        onChange={(_, val) => onStateChange('rolling', 'periodYears', val)}
        step={1}
        marks
        min={1}
        max={10}
        valueLabelDisplay="auto"
      />
    </Stack>
  );
}
