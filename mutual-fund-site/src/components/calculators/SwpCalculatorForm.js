import { Stack, Typography, TextField, InputAdornment } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

/**
 * A controlled form component for the SWP Calculator.
 * It receives its state and a function to update the state from its parent component.
 * This makes it a "dumb" component, focused purely on UI.
 * @param {object} props - The component props.
 * @param {object} props.state - The current state of the form inputs.
 * @param {Function} props.onStateChange - The function to call when an input value changes.
 */
export default function SwpCalculatorForm({ state, onStateChange }) {
  return (
    // Stack is a Material-UI component that arranges items vertically or horizontally with consistent spacing.
    <Stack spacing={2.5}>
      <Typography variant="h6" component="h3" gutterBottom>
        SWP Calculator
      </Typography>

      <TextField
        label="Initial Investment"
        type="number"
        value={state.initialInvestment}
        // When the user types, call the onStateChange function passed from the parent page.
        // We pass the calculator type ('swp'), the field name ('initialInvestment'), and the new value.
        onChange={e => onStateChange('swp', 'initialInvestment', Number(e.target.value))}
        // InputAdornment adds the Rupee symbol (₹) inside the text field for better UX.
        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
        fullWidth
      />

      <TextField
        label="Monthly Withdrawal"
        type="number"
        value={state.withdrawalAmount}
        onChange={e => onStateChange('swp', 'withdrawalAmount', Number(e.target.value))}
        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
        fullWidth
      />

      <DatePicker
        label="Withdrawal Start Date"
        value={state.fromDate}
        // The DatePicker component from MUI X returns a 'dayjs' object, which is handled by the parent state.
        onChange={val => onStateChange('swp', 'fromDate', val)}
      />

      <DatePicker
        label="Withdrawal End Date"
        value={state.toDate}
        onChange={val => onStateChange('swp', 'toDate', val)}
      />
    </Stack>
  );
}

