import { Alert, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import type { QuizQuestion, QuizResponse } from '../features/quiz'
import { ContentBlocks } from './ContentBlocks'

export function QuestionReview({ question, response, number }: { question: QuizQuestion; response: QuizResponse; number: number }) {
  return (
    <Card sx={{ borderColor: response.isCorrect ? '#bbdfc5' : '#f1b8b8' }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="overline" sx={{ fontWeight: 900 }}>Întrebarea {number}</Typography>
          <Chip size="small" color={response.isCorrect ? 'success' : 'error'} label={response.isCorrect ? 'Corect' : 'Incorect'} />
        </Stack>
        <Typography component="div" sx={{ fontSize: 18, fontWeight: 700 }}><ContentBlocks blocks={question.content} /></Typography>
        <Stack spacing={1.25} sx={{ mt: 3 }}>
          {question.options.map((option) => {
            const isCorrect = option.id === question.correctOptionId
            const isSelected = option.id === response.selectedOptionId
            return (
              <Box key={option.id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: isCorrect ? '#78be8c' : isSelected ? '#ef9a9a' : 'divider', bgcolor: isCorrect ? '#edf9f0' : isSelected ? '#fff1f1' : '#fafbfd' }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <Typography sx={{ fontWeight: 900, textTransform: 'uppercase' }}>{option.id}.</Typography>
                  <Box sx={{ flex: 1 }}><ContentBlocks blocks={option.content} /></Box>
                  <Stack direction="row" spacing={.5}>
                    {isSelected && <Chip size="small" label="Ales" />}
                    {isCorrect && <Chip size="small" color="success" label="Corect" />}
                  </Stack>
                </Stack>
              </Box>
            )
          })}
        </Stack>
        {question.explanation && question.explanation.length > 0 && <Alert severity="info" sx={{ mt: 2.5 }}><ContentBlocks blocks={question.explanation} /></Alert>}
      </CardContent>
    </Card>
  )
}
