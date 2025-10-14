import { Stack, Typography, TextField, InputAdornment } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function SipCalculatorForm({ state, onStateChange }) {
  return (
    <Stack spacing={2.5}>
      <Typography variant="h6">SIP Calculator</Typography>
      <TextField label="Monthly Investment" type="number" value={state.amount} onChange={e => onStateChange('sip', 'amount', Number(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
      <DatePicker label="Start Date" value={state.fromDate} onChange={val => onStateChange('sip', 'fromDate', val)} />
      <DatePicker label="End Date" value={state.toDate} onChange={val => onStateChange('sip', 'toDate', val)} />
    </Stack>
  );
}
