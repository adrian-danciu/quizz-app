import { Alert, Box, Button, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { useQuestionData } from '../app/questionDataContext'
import { AccountControls } from '../components/AccountControls'
import { useQuizStore } from '../store/quizStore'

export function HomePage() {
  const navigate = useNavigate()
  const { dataset, modules } = useQuestionData()
  const startFullExam = useQuizStore((state) => state.startFullExam)
  const completedSession = useQuizStore((state) => state.completedSession)
  const persistenceWarning = useQuizStore((state) => state.persistenceWarning)

  const startExam = () => {
    if (startFullExam()) navigate('/quiz')
  }

  return (
    <Box component="main">
      <Box
        sx={{
          color: 'white',
          bgcolor: '#10223f',
          backgroundImage: 'radial-gradient(circle at 84% 12%, rgba(37,99,235,.5), transparent 31%)',
          pt: { xs: 7, md: 11 },
          pb: { xs: 9, md: 13 },
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="overline" sx={{ color: '#93c5fd', fontWeight: 900, letterSpacing: '.16em' }}>
            Pregătire licență · Informatică 2026
          </Typography>
          <Typography variant="h1" sx={{ mt: 1.5, maxWidth: 780, fontSize: { xs: 44, md: 72 } }}>
            36 de întrebări între tine și nota 10.
          </Typography>
          <Typography sx={{ mt: 3, maxWidth: 650, color: '#cbd5e1', fontSize: { xs: 17, md: 20 }, lineHeight: 1.65 }}>
            Exersează din toate cele 15 module. Întrebările greșite revin mai des, iar progresul rămâne pe dispozitivul tău.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4, alignItems: { sm: 'center' } }}>
            <Button size="large" variant="contained" color="secondary" onClick={startExam}>Începe examenul</Button>
            <Button size="large" variant="outlined" onClick={() => navigate('/practice')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,.45)' }}>
              Alege un modul
            </Button>
            <Button color="inherit" onClick={() => navigate('/history')}>Istoric examene</Button>
            {completedSession && <Button color="inherit" onClick={() => navigate('/results')}>Ultimul rezultat</Button>}
            <AccountControls />
          </Stack>
          {persistenceWarning && (
            <Alert severity="warning" sx={{ mt: 3, maxWidth: 720 }}>
              {persistenceWarning}
            </Alert>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -5, pb: 9 }}>
        <Grid container spacing={2.5}>
          {[
            [dataset?.questions.length ?? 0, 'întrebări validate'],
            [modules.length, 'module de studiu'],
            [36, 'întrebări / examen'],
            ['0,25', 'puncte / răspuns'],
          ].map(([value, label]) => (
            <Grid key={label} size={{ xs: 6, md: 3 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 900 }}>{value}</Typography>
                  <Typography color="text.secondary">{label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: { xs: 4, md: 7 } }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>Două moduri, aceeași memorie.</Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 620, lineHeight: 1.7 }}>
              Examenul simulează punctajul final. Practica îți arată răspunsul corect pe loc. Ambele folosesc istoricul local pentru a prioritiza exact ce merită repetat.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ bgcolor: '#eaf1ff', borderColor: '#c8d9ff' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main' }}>Cum se calculează</Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 850 }}>1 punct din start + 0,25 pentru fiecare răspuns corect.</Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5 }}>36 corecte înseamnă nota 10.</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
