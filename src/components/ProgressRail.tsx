import { Box, LinearProgress, Stack, Typography } from '@mui/material'

export function ProgressRail({ current, total }: { current: number; total: number }) {
  const percentage = Math.round((current / total) * 100)
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontWeight: 900 }}>Întrebarea {current} / {total}</Typography>
        <Typography color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{percentage}%</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={percentage} sx={{ height: 8, borderRadius: 99, bgcolor: '#dce6f3' }} />
    </Box>
  )
}
