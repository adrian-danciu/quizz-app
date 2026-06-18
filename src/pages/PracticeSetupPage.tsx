import { Alert, Box, Button, Card, CardActionArea, CardContent, Container, Grid, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { useQuestionData } from '../app/questionDataContext'
import { useQuizStore } from '../store/quizStore'

export function PracticeSetupPage() {
  const navigate = useNavigate()
  const { modules } = useQuestionData()
  const startModulePractice = useQuizStore((state) => state.startModulePractice)
  const actionError = useQuizStore((state) => state.actionError)

  const start = (moduleId: string) => {
    if (startModulePractice(moduleId)) navigate('/quiz')
  }

  return (
    <Box component="main" sx={{ py: { xs: 5, md: 8 } }}>
      <Container maxWidth="lg">
        <Button onClick={() => navigate('/')}>← Înapoi</Button>
        <Typography variant="overline" sx={{ display: 'block', mt: 3, color: 'primary.main', fontWeight: 900, letterSpacing: '.14em' }}>
          Mod de practică
        </Typography>
        <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: 40, md: 58 } }}>Alege materia de azi.</Typography>
        <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 680, fontSize: 18, lineHeight: 1.7 }}>
          Primești până la 36 de întrebări fără repetări. După fiecare răspuns vezi imediat varianta corectă și explicația disponibilă.
        </Typography>
        {actionError && <Alert severity="error" sx={{ mt: 3 }}>{actionError}</Alert>}

        <Grid container spacing={2} sx={{ mt: 4 }}>
          {modules.map((module, index) => (
            <Grid key={module.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => start(module.id)} sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography sx={{ color: 'primary.main', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{String(index + 1).padStart(2, '0')}</Typography>
                      <Typography variant="caption" color="text.secondary">{module.questionCount} întrebări</Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ mt: 3, fontWeight: 850 }}>{module.name}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
