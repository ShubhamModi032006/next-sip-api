import { Stack, Typography, TextField, InputAdornment } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function LumpsumCalculatorForm({ state, onStateChange }) {
  return (
    <Stack spacing={2.5}>
      <Typography variant="h6">Lumpsum Calculator</Typography>
      <TextField label="Total Investment" type="number" value={state.amount} onChange={e => onStateChange('lumpsum', 'amount', Number(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
      <DatePicker label="Investment Date" value={state.fromDate} onChange={val => onStateChange('lumpsum', 'fromDate', val)} />
      <DatePicker label="Redemption Date" value={state.toDate} onChange={val => onStateChange('lumpsum', 'toDate', val)} />
    </Stack>
  );
}
