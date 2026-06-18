import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Container, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { useQuestionData } from '../app/questionDataContext'
import { AnswerOption, type AnswerVisualState } from '../components/AnswerOption'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ContentBlocks } from '../components/ContentBlocks'
import { ProgressRail } from '../components/ProgressRail'
import type { QuizQuestion, QuizResponse, QuizSession } from '../features/quiz'
import { useQuizStore } from '../store/quizStore'

function visualState(optionId: string, selectedId: string | undefined, response: QuizResponse | undefined, question: QuizQuestion, session: QuizSession): AnswerVisualState {
  if (!response) return optionId === selectedId ? 'selected' : 'neutral'
  if (session.feedbackPolicy === 'after-session') return optionId === response.selectedOptionId ? 'selected' : 'muted'
  if (optionId === question.correctOptionId) return 'correct'
  if (optionId === response.selectedOptionId) return 'incorrect'
  return 'muted'
}

function CurrentQuestion({ session, question }: { session: QuizSession; question: QuizQuestion }) {
  const navigate = useNavigate()
  const { modules } = useQuestionData()
  const submitAnswer = useQuizStore((state) => state.submitAnswer)
  const advance = useQuizStore((state) => state.advance)
  const abandon = useQuizStore((state) => state.abandonActiveSession)
  const actionError = useQuizStore((state) => state.actionError)
  const response = session.responses.find(({ questionId }) => questionId === question.id)
  const [selectedId, setSelectedId] = useState(response?.selectedOptionId)
  const [abandonOpen, setAbandonOpen] = useState(false)
  const moduleName = modules.find(({ id }) => id === question.moduleId)?.name
  const isLast = session.currentIndex === session.questionIds.length - 1

  const next = () => {
    if (!response && selectedId) {
      const ok = submitAnswer(question.id, selectedId)
      if (!ok) return
    }
    const outcome = advance()
    if (outcome === 'completed') navigate('/results', { replace: true })
  }

  return (
    <Box
      component="main"
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'grey.50',
        py: { xs: 1.5, md: 2 },
      }}
    >
      <Container maxWidth="md" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ flexShrink: 0 }}>
          <ProgressRail current={session.currentIndex + 1} total={session.questionIds.length} />
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
            <Chip size="small" label={session.mode === 'full-exam' ? 'Examen complet' : 'Practică'} color="primary" />
            {moduleName && <Chip size="small" label={moduleName} variant="outlined" />}
            <Chip size="small" label="Salvat local" variant="outlined" />
          </Stack>
        </Box>

        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <CardContent
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              p: { xs: 2, md: 3 },
              '&:last-child': { pb: { xs: 2, md: 3 } },
            }}
          >
            <Box sx={{ flexShrink: 1, minHeight: 0, overflow: 'auto' }}>
              <Typography component="div" sx={{ fontSize: { xs: 15, md: 16 }, fontWeight: 650, lineHeight: 1.6 }}>
                <ContentBlocks blocks={question.content} />
              </Typography>
            </Box>

            <Stack spacing={0.75} sx={{ mt: 1.5, flexShrink: 0 }}>
              {question.options.map((option) => (
                <AnswerOption
                  key={option.id}
                  option={option}
                  state={visualState(option.id, selectedId, response, question, session)}
                  disabled={Boolean(response)}
                  onClick={() => setSelectedId(option.id)}
                />
              ))}
            </Stack>

            <Box sx={{ flex: 1 }} />

            {actionError && <Alert severity="warning" sx={{ mb: 1, flexShrink: 0 }}>{actionError}</Alert>}

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={2}
              sx={{ mt: 1.5, justifyContent: 'space-between', flexShrink: 0 }}
            >
              <Button color="inherit" onClick={() => setAbandonOpen(true)}>Abandonează sesiunea</Button>
              <Button variant="contained" size="large" disabled={!selectedId && !response} onClick={next}>
                {isLast ? 'Vezi rezultatele' : 'Întrebarea următoare'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>

      <ConfirmDialog
        open={abandonOpen}
        title="Abandonezi sesiunea?"
        description="Răspunsurile acestei sesiuni se șterg. Progresul întrebărilor deja confirmate rămâne salvat."
        confirmLabel="Abandonează"
        onClose={() => setAbandonOpen(false)}
        onConfirm={() => { abandon(); navigate('/', { replace: true }) }}
      />
    </Box>
  )
}

export function QuizPage() {
  const { provider } = useQuestionData()
  const session = useQuizStore((state) => state.activeSession)
  if (!provider || !session) return null
  const questionId = session.questionIds[session.currentIndex]
  const question = provider.getById(questionId)
  if (!question) return <Alert severity="error">Întrebarea curentă nu mai este disponibilă.</Alert>
  return <CurrentQuestion key={question.id} session={session} question={question} />
}
