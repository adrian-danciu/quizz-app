import { Navigate, Outlet } from 'react-router'
import { useQuizStore } from '../store/quizStore'

export function SetupGuard() {
  const activeSession = useQuizStore((state) => state.activeSession)
  return activeSession ? <Navigate to="/quiz" replace /> : <Outlet />
}

export function QuizGuard() {
  const activeSession = useQuizStore((state) => state.activeSession)
  const completedSession = useQuizStore((state) => state.completedSession)
  if (activeSession) return <Outlet />
  return <Navigate to={completedSession ? '/results' : '/'} replace />
}

export function ResultsGuard() {
  const activeSession = useQuizStore((state) => state.activeSession)
  const completedSession = useQuizStore((state) => state.completedSession)
  if (activeSession) return <Navigate to="/quiz" replace />
  return completedSession ? <Outlet /> : <Navigate to="/" replace />
}
