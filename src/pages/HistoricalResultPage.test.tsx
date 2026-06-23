import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QuestionDataContext } from '../app/questionDataContext'
import { InMemoryQuestionProvider, type QuizQuestion, type QuizSession } from '../features/quiz'
import { useQuizStore } from '../store/quizStore'
import { HistoricalResultPage } from './HistoricalResultPage'

const question: QuizQuestion = {
  id: 'q-1',
  moduleId: 'module-a',
  content: [{ type: 'text', value: 'Întrebarea din raport' }],
  options: [
    { id: 'a', content: [{ type: 'text', value: 'Greșit' }] },
    { id: 'b', content: [{ type: 'text', value: 'Corect' }] },
  ],
  correctOptionId: 'b',
}

const historicalSession: QuizSession = {
  id: 'historical-exam',
  mode: 'full-exam',
  questionIds: ['q-1'],
  currentIndex: 0,
  responses: [{
    questionId: 'q-1',
    selectedOptionId: 'b',
    isCorrect: true,
    answeredAt: '2026-06-20T10:00:00.000Z',
  }],
  status: 'completed',
  feedbackPolicy: 'after-session',
  startedAt: '2026-06-20T09:59:00.000Z',
  completedAt: '2026-06-20T10:00:00.000Z',
}

function renderWithData(initialEntry: string) {
  const provider = new InMemoryQuestionProvider([question], ['module-a'])
  return render(
    <QuestionDataContext.Provider value={{
      modules: [{ id: 'module-a', name: 'Modul A', order: 1, questionCount: 1 }],
      provider,
      loading: false,
      retry: () => undefined,
    }}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="history" element={<div>Lista istoricului</div>} />
          <Route path="history/:sessionId" element={<HistoricalResultPage />} />
        </Routes>
      </MemoryRouter>
    </QuestionDataContext.Provider>,
  )
}

beforeEach(() => {
  useQuizStore.setState({
    examHistory: [historicalSession],
    completedSession: undefined,
    activeSession: undefined,
  })
})

describe('HistoricalResultPage', () => {
  it('renders the complete report for the selected historical exam', () => {
    renderWithData('/history/historical-exam')

    expect(screen.getByText('Nota 1,25')).toBeInTheDocument()
    expect(screen.getByText('Întrebarea din raport')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Înapoi la istoric' })).toBeInTheDocument()
    expect(useQuizStore.getState().completedSession).toBeUndefined()
  })

  it('redirects unknown exam IDs to the history list', () => {
    renderWithData('/history/unknown')
    expect(screen.getByText('Lista istoricului')).toBeInTheDocument()
  })
})
