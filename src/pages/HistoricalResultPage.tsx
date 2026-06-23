import { Navigate, useParams } from 'react-router'
import { ResultsReport } from '../components/ResultsReport'
import { useQuizStore } from '../store/quizStore'

export function HistoricalResultPage() {
  const { sessionId } = useParams()
  const session = useQuizStore((state) =>
    state.examHistory.find(({ id }) => id === sessionId),
  )

  return session ? (
    <ResultsReport session={session} historyView />
  ) : (
    <Navigate to="/history" replace />
  )
}
