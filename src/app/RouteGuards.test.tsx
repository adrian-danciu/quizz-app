import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { QuizSession } from '../features/quiz'
import { useQuizStore } from '../store/quizStore'
import { QuizGuard, SetupGuard } from './RouteGuards'

const activeSession: QuizSession = {
  id: 'session-1', mode: 'module-practice', moduleId: 'module-a', questionIds: ['q-1'],
  currentIndex: 0, responses: [], status: 'active', feedbackPolicy: 'after-answer',
  startedAt: '2026-06-18T12:00:00.000Z',
}

beforeEach(() => {
  useQuizStore.setState({ activeSession: undefined, completedSession: undefined })
})

describe('route guards', () => {
  it('redirects setup routes to the current quiz while a session is active', () => {
    useQuizStore.setState({ activeSession })
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <Routes>
          <Route element={<SetupGuard />}><Route path="practice" element={<div>Setup</div>} /></Route>
          <Route path="quiz" element={<div>Current quiz</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Current quiz')).toBeInTheDocument()
    expect(screen.queryByText('Setup')).not.toBeInTheDocument()
  })

  it('redirects an unavailable quiz to home', () => {
    render(
      <MemoryRouter initialEntries={['/quiz']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route element={<QuizGuard />}><Route path="quiz" element={<div>Quiz</div>} /></Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
  })
})
