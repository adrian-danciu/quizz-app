import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryQuestionProvider, type QuizQuestion, type QuizSession } from '../features/quiz'
import { migratePersistedState, STORAGE_KEY, useQuizStore } from './quizStore'

function question(id: string, moduleId = 'module-a'): QuizQuestion {
  return {
    id,
    moduleId,
    content: [{ type: 'text', value: id }],
    options: [
      { id: 'a', content: [{ type: 'text', value: 'A' }] },
      { id: 'b', content: [{ type: 'text', value: 'B' }] },
    ],
    correctOptionId: 'b',
  }
}

function provider(count = 40) {
  return new InMemoryQuestionProvider(
    Array.from({ length: count }, (_, index) => question(`q-${index + 1}`)),
    ['module-a'],
  )
}

function readyToCompleteExam(id: string): QuizSession {
  const questionIds = Array.from({ length: 36 }, (_, index) => `q-${index + 1}`)
  return {
    id,
    mode: 'full-exam',
    questionIds,
    currentIndex: 35,
    responses: questionIds.map((questionId) => ({
      questionId,
      selectedOptionId: 'b',
      isCorrect: true,
      answeredAt: '2026-06-18T12:00:00.000Z',
    })),
    status: 'active',
    feedbackPolicy: 'after-session',
    startedAt: '2026-06-18T12:00:00.000Z',
  }
}

beforeEach(() => {
  localStorage.clear()
  useQuizStore.setState({
    progressByQuestionId: {}, activeSession: undefined, completedSession: undefined,
    examHistory: [], selectedPracticeModuleId: undefined, provider: undefined, initialized: false,
    actionError: undefined, persistenceWarning: undefined,
  })
})

afterEach(() => vi.useRealTimers())

describe('quiz store', () => {
  it('starts and persists a 36-question full exam without persisting the dataset', () => {
    const store = useQuizStore.getState()
    store.initialize(provider())

    expect(useQuizStore.getState().startFullExam()).toBe(true)
    expect(useQuizStore.getState().activeSession?.questionIds).toHaveLength(36)
    const saved = localStorage.getItem(STORAGE_KEY) ?? ''
    expect(saved).toContain('questionIds')
    expect(saved).not.toContain('correctOptionId')
  })

  it('locks a submitted practice answer and updates progress once', () => {
    const store = useQuizStore.getState()
    store.initialize(provider(1))
    expect(useQuizStore.getState().startModulePractice('module-a')).toBe(true)
    const id = useQuizStore.getState().activeSession!.questionIds[0]

    expect(useQuizStore.getState().submitAnswer(id, 'a')).toBe(true)
    expect(useQuizStore.getState().submitAnswer(id, 'b')).toBe(false)
    expect(useQuizStore.getState().activeSession?.responses).toHaveLength(1)
    expect(useQuizStore.getState().progressByQuestionId[id].seenCount).toBe(1)
  })

  it('moves a finished session into completed state', () => {
    useQuizStore.getState().initialize(provider(1))
    useQuizStore.getState().startModulePractice('module-a')
    const id = useQuizStore.getState().activeSession!.questionIds[0]
    useQuizStore.getState().submitAnswer(id, 'b')

    expect(useQuizStore.getState().advance()).toBe('completed')
    expect(useQuizStore.getState().activeSession).toBeUndefined()
    expect(useQuizStore.getState().completedSession?.status).toBe('completed')
    expect(useQuizStore.getState().examHistory).toEqual([])
  })

  it('persists completed full exams in newest-first history', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T10:00:00.000Z'))
    useQuizStore.setState({ activeSession: readyToCompleteExam('exam-1') })
    expect(useQuizStore.getState().advance()).toBe('completed')

    vi.setSystemTime(new Date('2026-06-21T10:00:00.000Z'))
    useQuizStore.setState({ activeSession: readyToCompleteExam('exam-2') })
    expect(useQuizStore.getState().advance()).toBe('completed')

    expect(useQuizStore.getState().examHistory.map(({ id }) => id)).toEqual([
      'exam-2',
      'exam-1',
    ])
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(saved.state.examHistory).toHaveLength(2)
  })

  it('deduplicates exam IDs and retains only the latest 50 exams', () => {
    vi.useFakeTimers()
    for (let index = 0; index < 52; index += 1) {
      vi.setSystemTime(new Date(Date.UTC(2026, 0, index + 1)))
      useQuizStore.setState({ activeSession: readyToCompleteExam(`exam-${index}`) })
      useQuizStore.getState().advance()
    }

    vi.setSystemTime(new Date('2026-06-22T10:00:00.000Z'))
    useQuizStore.setState({ activeSession: readyToCompleteExam('exam-51') })
    useQuizStore.getState().advance()

    const history = useQuizStore.getState().examHistory
    expect(history).toHaveLength(50)
    expect(history[0].id).toBe('exam-51')
    expect(history.filter(({ id }) => id === 'exam-51')).toHaveLength(1)
    expect(history.some(({ id }) => id === 'exam-0')).toBe(false)
  })

  it('drops an invalid restored session while preserving progress', () => {
    const invalidSession: QuizSession = {
      id: 'old', mode: 'module-practice', moduleId: 'module-a', questionIds: ['missing'],
      currentIndex: 0, responses: [], status: 'active', feedbackPolicy: 'after-answer',
      startedAt: '2026-06-18T12:00:00.000Z',
    }
    useQuizStore.setState({
      activeSession: invalidSession,
      progressByQuestionId: { 'q-1': { questionId: 'q-1', seenCount: 1, correctCount: 1, wrongCount: 0 } },
    })

    useQuizStore.getState().initialize(provider(1))
    expect(useQuizStore.getState().activeSession).toBeUndefined()
    expect(useQuizStore.getState().progressByQuestionId['q-1'].seenCount).toBe(1)
  })

  it('drops invalid historical sessions during provider initialization', () => {
    const valid = {
      ...readyToCompleteExam('valid'),
      status: 'completed' as const,
      completedAt: '2026-06-20T10:00:00.000Z',
    }
    const invalid = {
      ...valid,
      id: 'invalid',
      questionIds: [...valid.questionIds.slice(0, 35), 'missing'],
    }
    useQuizStore.setState({ examHistory: [invalid, valid] })

    useQuizStore.getState().initialize(provider())

    expect(useQuizStore.getState().examHistory.map(({ id }) => id)).toEqual([
      'valid',
    ])
  })

  it('migrates the previous completed full exam into history', () => {
    const completedExam = {
      ...readyToCompleteExam('previous-result'),
      status: 'completed' as const,
      completedAt: '2026-06-20T10:00:00.000Z',
    }

    const migrated = migratePersistedState({
      progressByQuestionId: {},
      completedSession: completedExam,
    })

    expect(migrated.examHistory).toEqual([completedExam])
    expect(migrated.completedSession).toEqual(completedExam)
  })

  it('clears all local quiz data while preserving the loaded provider', () => {
    const loadedProvider = provider()
    useQuizStore.setState({
      provider: loadedProvider,
      initialized: true,
      progressByQuestionId: {
        'q-1': { questionId: 'q-1', seenCount: 1, correctCount: 1, wrongCount: 0 },
      },
      activeSession: readyToCompleteExam('active'),
      examHistory: [{
        ...readyToCompleteExam('history'),
        status: 'completed',
        completedAt: '2026-06-20T10:00:00.000Z',
      }],
      selectedPracticeModuleId: 'module-a',
    })

    useQuizStore.getState().resetLocalQuizData()

    expect(useQuizStore.getState()).toMatchObject({
      provider: loadedProvider,
      initialized: true,
      progressByQuestionId: {},
      examHistory: [],
      activeSession: undefined,
      completedSession: undefined,
      selectedPracticeModuleId: undefined,
    })
  })
})
