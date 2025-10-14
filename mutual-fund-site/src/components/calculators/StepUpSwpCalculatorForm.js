import { Stack, Typography, TextField, InputAdornment, Slider } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function StepUpSwpCalculatorForm({ state, onStateChange }) {
  return (
    <Stack spacing={2.5}>
      <Typography variant="h6">Step-Up SWP Calculator</Typography>
      <TextField
        label="Initial Investment"
        type="number"
        value={state.initialInvestment}
        onChange={e => onStateChange('stepUpSwp', 'initialInvestment', Number(e.target.value))}
        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
      />
      <TextField
        label="Initial Monthly Withdrawal"
        type="number"
        value={state.withdrawalAmount}
        onChange={e => onStateChange('stepUpSwp', 'withdrawalAmount', Number(e.target.value))}
        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
      />
      <DatePicker
        label="Withdrawal Start Date"
        value={state.fromDate}
        onChange={val => onStateChange('stepUpSwp', 'fromDate', val)}
      />
      <DatePicker
        label="Withdrawal End Date"
        value={state.toDate}
        onChange={val => onStateChange('stepUpSwp', 'toDate', val)}
      />
      <Typography gutterBottom>Annual Increase in Withdrawal: {state.annualIncrease}%</Typography>
      <Slider
        value={state.annualIncrease}
        onChange={(_, val) => onStateChange('stepUpSwp', 'annualIncrease', val)}
        step={1} marks min={1} max={20} valueLabelDisplay="auto"
      />
    </Stack>
  );
}
