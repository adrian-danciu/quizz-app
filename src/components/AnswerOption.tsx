import { Box, Stack, Typography } from '@mui/material'
import type { QuizOption } from '../features/quiz'
import { ContentBlocks } from './ContentBlocks'

export type AnswerVisualState = 'neutral' | 'selected' | 'correct' | 'incorrect' | 'muted'

const stateStyles: Record<AnswerVisualState, { border: string; bg: string }> = {
  neutral: { border: '#d8e1ec', bg: '#ffffff' },
  selected: { border: '#2563eb', bg: '#eef4ff' },
  correct: { border: '#15803d', bg: '#edf9f0' },
  incorrect: { border: '#dc2626', bg: '#fff1f1' },
  muted: { border: '#e2e8f0', bg: '#f8fafc' },
}

export function AnswerOption({ option, state, disabled, onClick }: { option: QuizOption; state: AnswerVisualState; disabled?: boolean; onClick?: () => void }) {
  const style = stateStyles[state]
  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={state === 'selected'}
      sx={{
        width: '100%', textAlign: 'left', p: { xs: '7px 10px', md: '8px 12px' }, borderRadius: 2,
        border: `2px solid ${style.border}`, bgcolor: style.bg, color: 'text.primary',
        cursor: disabled ? 'default' : 'pointer', opacity: state === 'muted' ? .72 : 1,
        transition: 'border-color .15s ease, background-color .15s ease, transform .15s ease',
        '&:hover': disabled ? {} : { borderColor: '#2563eb', transform: 'translateY(-1px)' },
        '&:focus-visible': { outline: '3px solid rgba(249,115,22,.35)', outlineOffset: 2 },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ flex: '0 0 auto', width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: state === 'selected' ? 'primary.main' : 'rgba(16,34,63,.08)', color: state === 'selected' ? 'white' : 'text.primary', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>
          {option.id}
        </Box>
        <Typography component="div" sx={{ flex: 1, fontSize: { xs: 13, md: 14 } }}><ContentBlocks blocks={option.content} /></Typography>
      </Stack>
    </Box>
  )
}
