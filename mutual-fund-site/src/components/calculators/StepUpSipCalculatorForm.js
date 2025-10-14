import { Stack, Typography, TextField, InputAdornment, Slider } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function StepUpSipCalculatorForm({ state, onStateChange }) {
  return (
    <Stack spacing={2.5}>
      <Typography variant="h6">Step-Up SIP Calculator</Typography>
      <TextField label="Initial Monthly Investment" type="number" value={state.amount} onChange={e => onStateChange('stepUpSip', 'amount', Number(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
      <DatePicker label="Start Date" value={state.fromDate} onChange={val => onStateChange('stepUpSip', 'fromDate', val)} />
      <DatePicker label="End Date" value={state.toDate} onChange={val => onStateChange('stepUpSip', 'toDate', val)} />
      <Typography gutterBottom>Annual Increase: {state.annualIncrease}%</Typography>
      <Slider value={state.annualIncrease} onChange={(_, val) => onStateChange('stepUpSip', 'annualIncrease', val)} step={1} marks min={1} max={30} valueLabelDisplay="auto" />
    </Stack>
  );
}
