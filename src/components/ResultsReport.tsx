import { Box, Button, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { useQuestionData } from '../app/questionDataContext'
import { calculateQuizResult, type QuizSession } from '../features/quiz'
import { useQuizStore } from '../store/quizStore'
import { orderResponsesForReview } from '../pages/resultsReview'
import { QuestionReview } from './QuestionReview'

export function ResultsReport({
  session,
  historyView = false,
}: {
  session: QuizSession
  historyView?: boolean
}) {
  const navigate = useNavigate()
  const { provider, modules } = useQuestionData()
  const startFullExam = useQuizStore((state) => state.startFullExam)
  if (!provider) return null

  const result = calculateQuizResult(session)
  const originalOrder = new Map(
    session.questionIds.map((id, index) => [id, index]),
  )
  const responses = orderResponsesForReview(
    session.responses,
    session.questionIds,
  )
  const moduleName = session.moduleId
    ? modules.find(({ id }) => id === session.moduleId)?.name
    : undefined

  const newExam = () => {
    if (startFullExam()) navigate('/quiz')
  }

  return (
    <Box component="main" sx={{ pb: 9 }}>
      <Box sx={{ bgcolor: '#10223f', color: 'white', py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Typography variant="overline" sx={{ color: '#93c5fd', fontWeight: 900, letterSpacing: '.15em' }}>
            {moduleName ?? 'Examen complet'}
          </Typography>
          <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: 46, md: 72 } }}>
            Nota {result.score.toFixed(2).replace('.', ',')}
          </Typography>
          <Typography sx={{ mt: 2, color: '#cbd5e1', fontSize: 18 }}>
            Ai răspuns corect la {result.correctAnswers} din {result.totalQuestions} întrebări.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
            <Button variant="contained" color="secondary" onClick={newExam}>Examen nou</Button>
            {historyView ? (
              <Button variant="outlined" onClick={() => navigate('/history')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,.45)' }}>
                Înapoi la istoric
              </Button>
            ) : (
              <Button variant="outlined" onClick={() => navigate('/practice')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,.45)' }}>
                Practică un modul
              </Button>
            )}
            <Button color="inherit" onClick={() => navigate('/')}>Acasă</Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4 }}>
        <Grid container spacing={2}>
          {[
            [result.correctAnswers, 'corecte'],
            [result.wrongAnswers, 'incorecte'],
            [`${Math.round(result.percentage)}%`, 'rata de răspuns corect'],
          ].map(([value, label]) => (
            <Grid key={label} size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main' }}>{value}</Typography>
                  <Typography color="text.secondary">{label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h2" sx={{ mt: { xs: 6, md: 9 }, fontSize: { xs: 34, md: 46 } }}>
          Recapitulare completă
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Întrebările greșite apar primele, apoi cele rezolvate corect.
        </Typography>
        <Stack spacing={2.5} sx={{ mt: 4 }}>
          {responses.map((response) => {
            const question = provider.getById(response.questionId)
            if (!question) return null
            return (
              <QuestionReview
                key={question.id}
                question={question}
                response={response}
                number={(originalOrder.get(question.id) ?? 0) + 1}
              />
            )
          })}
        </Stack>
      </Container>
    </Box>
  )
}
