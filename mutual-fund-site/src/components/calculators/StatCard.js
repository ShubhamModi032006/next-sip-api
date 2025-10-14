import { Paper, Typography, Stack, Tooltip as MuiTooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function StatCard({ title, value, color = 'text.primary', subValue = null, tooltip = null }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%', textAlign: 'center' }}>
      <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ minHeight: '48px' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 0 }}>
          {title}
        </Typography>
        {tooltip && (
          <MuiTooltip title={tooltip} placement="top">
            <InfoOutlinedIcon sx={{ fontSize: '1rem', color: 'text.secondary', cursor: 'pointer' }} />
          </MuiTooltip>
        )}
      </Stack>
      <Typography variant="h5" component="p" color={color} sx={{ fontWeight: 'medium' }}>
        {value}
      </Typography>
      {subValue && <Typography variant="caption" color="text.secondary">{subValue}</Typography>}
    </Paper>
  );
}
