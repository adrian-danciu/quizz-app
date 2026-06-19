import { Box, LinearProgress, Stack, Typography } from '@mui/material'

export function ProgressRail({ current, total }: { current: number; total: number }) {
  const percentage = Math.round((current / total) * 100)
  return (
    <Box sx={{ mb: 'var(--quiz-progress-margin, 12px)' }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 'var(--quiz-progress-row-margin, 8px)' }}>
        <Typography sx={{ fontWeight: 900, fontSize: 'var(--quiz-progress-font-size, 1rem)' }}>Întrebarea {current} / {total}</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 'var(--quiz-progress-font-size, 1rem)', fontVariantNumeric: 'tabular-nums' }}>{percentage}%</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={percentage} sx={{ height: 'var(--quiz-progress-height, 8px)', borderRadius: 99, bgcolor: '#dce6f3' }} />
    </Box>
  )
}
