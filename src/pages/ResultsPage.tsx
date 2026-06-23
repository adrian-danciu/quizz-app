import { ResultsReport } from '../components/ResultsReport'
import { useQuizStore } from '../store/quizStore'

export function ResultsPage() {
  const session = useQuizStore((state) => state.completedSession)
  return session ? <ResultsReport session={session} /> : null
}
