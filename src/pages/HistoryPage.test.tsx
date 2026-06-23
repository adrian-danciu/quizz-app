import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import { InMemoryQuestionProvider, type QuizQuestion, type QuizSession } from '../features/quiz'
import { useQuizStore } from '../store/quizStore'
import { HistoryPage } from './HistoryPage'

function questions(): QuizQuestion[] {
  return Array.from({ length: 40 }, (_, index) => ({
    id: `q-${index + 1}`,
    moduleId: 'module-a',
    content: [{ type: 'text', value: `Întrebarea ${index + 1}` }],
    options: [
      { id: 'a', content: [{ type: 'text', value: 'A' }] },
      { id: 'b', content: [{ type: 'text', value: 'B' }] },
    ],
    correctOptionId: 'b',
  }))
}

function completedExam(id: string): QuizSession {
  const questionIds = questions().slice(0, 36).map(({ id: questionId }) => questionId)
  return {
    id,
    mode: 'full-exam',
    questionIds,
    currentIndex: 35,
    responses: questionIds.map((questionId) => ({
      questionId,
      selectedOptionId: 'b',
      isCorrect: true,
      answeredAt: '2026-06-20T10:00:00.000Z',
    })),
    status: 'completed',
    feedbackPolicy: 'after-session',
    startedAt: '2026-06-20T09:30:00.000Z',
    completedAt: '2026-06-20T10:00:00.000Z',
  }
}

beforeEach(() => {
  useQuizStore.setState({
    examHistory: [],
    activeSession: undefined,
    completedSession: undefined,
    provider: undefined,
  })
})

describe('HistoryPage', () => {
  it('shows saved exam summaries and opens the selected report route', async () => {
    useQuizStore.setState({ examHistory: [completedExam('exam-1')] })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/history']}>
        <Routes>
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/:sessionId" element={<div>Raport selectat</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Nota 10,00')).toBeInTheDocument()
    expect(screen.getByText('36 din 36 corecte')).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Vezi raportul' }))
    expect(screen.getByText('Raport selectat')).toBeInTheDocument()
  })

  it('starts a full exam from the empty state', async () => {
    const provider = new InMemoryQuestionProvider(questions(), ['module-a'])
    useQuizStore.setState({ provider })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/history']}>
        <Routes>
          <Route path="history" element={<HistoryPage />} />
          <Route path="quiz" element={<div>Examen început</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Niciun examen finalizat încă')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Începe primul examen' }))
    expect(screen.getByText('Examen început')).toBeInTheDocument()
    expect(useQuizStore.getState().activeSession?.mode).toBe('full-exam')
  })
})
