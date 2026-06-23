import { Box, Button, Card, CardContent, Chip, Container, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { calculateQuizResult } from '../features/quiz'
import { useQuizStore } from '../store/quizStore'

const dateFormatter = new Intl.DateTimeFormat('ro-RO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function HistoryPage() {
  const navigate = useNavigate()
  const examHistory = useQuizStore((state) => state.examHistory)
  const startFullExam = useQuizStore((state) => state.startFullExam)

  const startExam = () => {
    if (startFullExam()) navigate('/quiz')
  }

  return (
    <Box component="main" sx={{ minHeight: '100dvh', pb: 9 }}>
      <Box
        sx={{
          color: 'white',
          bgcolor: '#10223f',
          backgroundImage: 'radial-gradient(circle at 88% 8%, rgba(249,115,22,.26), transparent 30%)',
          py: { xs: 6, md: 9 },
        }}
      >
        <Container maxWidth="md">
          <Typography variant="overline" sx={{ color: '#93c5fd', fontWeight: 900, letterSpacing: '.15em' }}>
            Salvat pe acest dispozitiv
          </Typography>
          <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: 42, md: 64 } }}>
            Istoric examene
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 650, color: '#cbd5e1', fontSize: { xs: 16, md: 18 }, lineHeight: 1.65 }}>
            Ultimele {examHistory.length} din maximum 50 de examene finalizate. Rezultatele rămân în acest browser.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
            <Button variant="contained" color="secondary" onClick={startExam}>Examen nou</Button>
            <Button variant="outlined" onClick={() => navigate('/')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,.45)' }}>
              Acasă
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: { xs: 3, md: 5 } }}>
        {examHistory.length === 0 ? (
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ px: 3, py: { xs: 6, md: 8 } }}>
              <Typography variant="h4" sx={{ fontWeight: 850 }}>Niciun examen finalizat încă</Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                Finalizează un examen de 36 de întrebări, iar raportul va apărea aici automat.
              </Typography>
              <Button variant="contained" sx={{ mt: 3 }} onClick={startExam}>Începe primul examen</Button>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {examHistory.map((session, index) => {
              const result = calculateQuizResult(session)
              return (
                <Card key={session.id}>
                  <CardContent
                    sx={{
                      p: { xs: 2.5, sm: 3 },
                      '&:last-child': { pb: { xs: 2.5, sm: 3 } },
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2.5,
                      alignItems: { sm: 'center' },
                    }}
                  >
                    <Box
                      aria-hidden="true"
                      sx={{
                        width: 48,
                        height: 48,
                        flex: '0 0 auto',
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: index === 0 ? 'secondary.main' : '#eaf1ff',
                        color: index === 0 ? 'white' : 'primary.main',
                        fontWeight: 900,
                      }}
                    >
                      {index + 1}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 850 }}>
                          Nota {result.score.toFixed(2).replace('.', ',')}
                        </Typography>
                        {index === 0 && <Chip size="small" color="secondary" label="Cel mai recent" />}
                      </Stack>
                      <Typography sx={{ mt: 0.75, fontWeight: 700 }}>
                        {result.correctAnswers} din {result.totalQuestions} corecte
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {dateFormatter.format(new Date(session.completedAt!))}
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/history/${session.id}`)}
                      sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
                    >
                      Vezi raportul
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        )}
      </Container>
    </Box>
  )
}
