import { Box, Chip, Container, Stack, Typography } from '@mui/material'
import { Link } from 'react-router'
import { useQuizStore } from '../store/quizStore'

export function AppHeader() {
  const activeSession = useQuizStore((state) => state.activeSession)

  return (
    <Box component="header" sx={{ bgcolor: '#10223f', color: 'white', py: 1.75 }}>
      <Container maxWidth="lg">
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            component={Link}
            to={activeSession ? '/quiz' : '/'}
            sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 900, letterSpacing: '0.05em' }}
          >
            LICENȚĂ / 2026
          </Typography>
          <Chip
            size="small"
            label={activeSession ? 'Sesiune salvată local' : 'Progres salvat local'}
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.16)' }}
          />
        </Stack>
      </Container>
    </Box>
  )
}
