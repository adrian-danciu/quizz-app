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
import { getQuizPrimaryAction, getQuizPrimaryLabel } from './quizFlow'
import { useQuizViewportFit } from './useQuizViewportFit'

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
  const { frameRef, contentRef, density } = useQuizViewportFit(question.id)
  const isCompact = density !== 'comfortable'
  const isDense = density === 'dense'

  const handlePrimaryAction = () => {
    const action = getQuizPrimaryAction(
      Boolean(response),
      session.feedbackPolicy,
    )

    if (
      (action === 'submit' || action === 'submit-and-advance') &&
      selectedId
    ) {
      const ok = submitAnswer(question.id, selectedId)
      if (!ok) return
      if (action === 'submit') return
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
        bgcolor: 'grey.50',
        overflowX: 'hidden',
        overflowY: 'auto',
        py: {
          xs: `max(${isDense ? 3 : isCompact ? 5 : 8}px, env(safe-area-inset-top))`,
          md: 2,
        },
        pb: {
          xs: `max(${isDense ? 3 : isCompact ? 5 : 8}px, env(safe-area-inset-bottom))`,
          md: 2,
        },
      }}
    >
      <Container
        ref={frameRef}
        maxWidth="md"
        disableGutters
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          width: '100%',
          px: { xs: isDense ? 0.5 : isCompact ? 0.75 : 1, sm: 2 },
          overflow: 'visible',
        }}
      >
        <Box
          ref={contentRef}
          data-density={density}
          sx={{
            minHeight: '100%',
            minWidth: 0,
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible',
            '--quiz-code-font-size': isDense ? '0.56rem' : isCompact ? '0.64rem' : '0.78rem',
            '--quiz-code-line-height': isDense ? 1.25 : isCompact ? 1.35 : 1.6,
            '--quiz-code-padding-x': isDense ? '6px' : isCompact ? '8px' : '12px',
            '--quiz-code-padding-top': isDense ? '18px' : isCompact ? '22px' : '30px',
            '--quiz-code-padding-bottom': isDense ? '5px' : isCompact ? '7px' : '12px',
            '--quiz-block-gap': isDense ? '3px' : isCompact ? '5px' : '12px',
            '--quiz-answer-padding-y': isDense ? '3px' : isCompact ? '5px' : '7px',
            '--quiz-answer-padding-x': isDense ? '5px' : isCompact ? '7px' : '10px',
            '--quiz-answer-gap': isDense ? '5px' : isCompact ? '7px' : '12px',
            '--quiz-answer-font-size': isDense ? '0.58rem' : isCompact ? '0.68rem' : '0.8125rem',
            '--quiz-answer-marker-size': isDense ? '18px' : isCompact ? '22px' : '26px',
            '--quiz-progress-margin': isDense ? '3px' : isCompact ? '5px' : '12px',
            '--quiz-progress-row-margin': isDense ? '2px' : isCompact ? '4px' : '8px',
            '--quiz-progress-font-size': isDense ? '0.68rem' : isCompact ? '0.78rem' : '1rem',
            '--quiz-progress-height': isDense ? '4px' : isCompact ? '5px' : '8px',
          }}
        >
        <Box sx={{ flexShrink: 0 }}>
          <ProgressRail current={session.currentIndex + 1} total={session.questionIds.length} />
          <Stack
            direction="row"
            sx={{
              mb: isDense ? 0.375 : isCompact ? 0.625 : 1.5,
              gap: isDense ? 0.375 : 0.75,
              flexWrap: 'wrap',
              '& .MuiChip-root': {
                height: isDense ? 20 : isCompact ? 24 : 32,
                fontSize: isDense ? 10 : isCompact ? 11 : 13,
              },
            }}
          >
            <Chip size="small" label={session.mode === 'full-exam' ? 'Examen complet' : 'Practică'} color="primary" />
            {moduleName && <Chip size="small" label={moduleName} variant="outlined" />}
            <Chip size="small" label="Salvat local" variant="outlined" />
          </Stack>
        </Box>

        <Card sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%', overflow: 'visible' }}>
          <CardContent
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              overflow: 'visible',
              p: { xs: isDense ? 0.75 : isCompact ? 1 : 1.5, md: 3 },
              '&:last-child': { pb: { xs: isDense ? 0.75 : isCompact ? 1 : 1.5, md: 3 } },
            }}
          >
            <Box sx={{ flexShrink: 0, minWidth: 0, maxWidth: '100%' }}>
              <Typography
                component="div"
                sx={{
                  minWidth: 0,
                  fontSize: { xs: isDense ? 11 : isCompact ? 12.5 : 15, md: 16 },
                  fontWeight: 650,
                  lineHeight: isDense ? 1.25 : isCompact ? 1.4 : 1.6,
                }}
              >
                <ContentBlocks blocks={question.content} />
              </Typography>
            </Box>

            <Stack
              sx={{
                mt: isDense ? 0.375 : isCompact ? 0.625 : 1.5,
                gap: isDense ? 0.375 : isCompact ? 0.5 : 0.75,
                flexShrink: 0,
                minWidth: 0,
              }}
            >
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

            {response && session.feedbackPolicy === 'after-answer' && (
              <Alert
                severity={response.isCorrect ? 'success' : 'error'}
                sx={{
                  mb: isDense ? 0.375 : 1,
                  py: isDense ? 0 : undefined,
                  fontSize: isDense ? 10 : undefined,
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ fontWeight: 850 }}>
                  {response.isCorrect
                    ? 'Corect.'
                    : `Răspunsul corect este ${question.correctOptionId.toUpperCase()}.`}
                </Typography>
                {question.explanation && (
                  <Box sx={{ mt: 0.75 }}>
                    <ContentBlocks blocks={question.explanation} />
                  </Box>
                )}
              </Alert>
            )}

            {actionError && <Alert severity="warning" sx={{ mb: 1, flexShrink: 0 }}>{actionError}</Alert>}

            <Stack
              direction="row"
              sx={{
                mt: isDense ? 0.375 : isCompact ? 0.625 : 1.5,
                gap: isDense ? 0.5 : 1,
                justifyContent: 'space-between',
                flexShrink: 0,
                '& .MuiButton-root': {
                  minWidth: 0,
                  minHeight: isDense ? 28 : isCompact ? 34 : 42,
                  px: isDense ? 0.75 : isCompact ? 1.25 : 2.75,
                  fontSize: isDense ? 9.5 : isCompact ? 11 : 14,
                  lineHeight: 1.15,
                },
              }}
            >
              <Button sx={{ flex: '1 1 42%' }} color="inherit" onClick={() => setAbandonOpen(true)}>Abandonează sesiunea</Button>
              <Button sx={{ flex: '1 1 58%' }} variant="contained" size="large" disabled={!selectedId && !response} onClick={handlePrimaryAction}>
                {getQuizPrimaryLabel(
                  Boolean(response),
                  session.feedbackPolicy,
                  isLast,
                )}
              </Button>
            </Stack>
          </CardContent>
        </Card>
        </Box>
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
