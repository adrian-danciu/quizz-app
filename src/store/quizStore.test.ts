import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryQuestionProvider, type QuizQuestion, type QuizSession } from '../features/quiz'
import { STORAGE_KEY, useQuizStore } from './quizStore'

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

beforeEach(() => {
  localStorage.clear()
  useQuizStore.setState({
    progressByQuestionId: {}, activeSession: undefined, completedSession: undefined,
    selectedPracticeModuleId: undefined, provider: undefined, initialized: false,
    actionError: undefined, persistenceWarning: undefined,
  })
})

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
})
