import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router'
import { HomePage } from '../pages/HomePage'
import { PracticeSetupPage } from '../pages/PracticeSetupPage'
import { QuizPage } from '../pages/QuizPage'
import { ResultsPage } from '../pages/ResultsPage'
import { useQuestionData } from './questionDataContext'
import { QuizGuard, ResultsGuard, SetupGuard } from './RouteGuards'

export function AppRouter() {
  const { loading, error, retry } = useQuestionData()

  if (loading) {
    return (
      <Stack sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress aria-label="Se încarcă întrebările" />
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Alert severity="error" action={<Button onClick={retry}>Reîncearcă</Button>}>
          {error}
        </Alert>
      </Stack>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Routes>
        <Route element={<SetupGuard />}>
          <Route index element={<HomePage />} />
          <Route path="practice" element={<PracticeSetupPage />} />
        </Route>
        <Route element={<QuizGuard />}>
          <Route path="quiz" element={<QuizPage />} />
        </Route>
        <Route element={<ResultsGuard />}>
          <Route path="results" element={<ResultsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  )
}
