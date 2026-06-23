import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  advanceQuizSession,
  createQuizSession,
  restoreQuizSession,
  serializeQuizSession,
  submitQuizAnswer,
  type ProgressByQuestionId,
  type QuestionProvider,
  type QuizSession,
} from '../features/quiz'

const STORAGE_KEY = 'licenta-quiz-state'
const STORAGE_VERSION = 2
const MAX_EXAM_HISTORY = 50

type PersistedQuizState = {
  progressByQuestionId: ProgressByQuestionId
  activeSession?: QuizSession
  completedSession?: QuizSession
  examHistory: QuizSession[]
  selectedPracticeModuleId?: string
}

type QuizStore = PersistedQuizState & {
  provider?: QuestionProvider
  initialized: boolean
  actionError?: string
  persistenceWarning?: string
  initialize: (provider: QuestionProvider) => void
  startFullExam: () => boolean
  startModulePractice: (moduleId: string) => boolean
  submitAnswer: (questionId: string, optionId: string) => boolean
  advance: () => 'advanced' | 'completed' | 'error'
  abandonActiveSession: () => void
  clearCompletedSession: () => void
  clearActionError: () => void
  applyCloudState: (
    progressByQuestionId: ProgressByQuestionId,
    examHistory: QuizSession[],
  ) => void
  resetLocalQuizData: () => void
  setPersistenceWarning: (warning?: string) => void
}

function createSessionId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `quiz-${Date.now()}`
}

function messageForError(code: string): string {
  const messages: Record<string, string> = {
    'unknown-module': 'Modulul selectat nu mai este disponibil.',
    'insufficient-exam-questions': 'Nu sunt suficiente întrebări pentru examen.',
    'empty-practice-module': 'Modulul selectat nu conține întrebări.',
    'inactive-session': 'Sesiunea nu mai este activă.',
    'mismatched-current-question': 'Întrebarea curentă nu mai este disponibilă.',
    'invalid-option': 'Opțiunea selectată nu este validă.',
    'duplicate-answer': 'Răspunsul acestei întrebări este deja blocat.',
    'advance-before-answer': 'Confirmă răspunsul înainte de a continua.',
  }
  return messages[code] ?? 'Acțiunea nu a putut fi finalizată.'
}

const initialPersistedState: PersistedQuizState = {
  progressByQuestionId: {},
  examHistory: [],
}

function orderAndLimitExamHistory(sessions: readonly QuizSession[]): QuizSession[] {
  const uniqueById = new Map<string, QuizSession>()

  for (const session of sessions) {
    if (
      session.mode === 'full-exam' &&
      session.status === 'completed' &&
      session.completedAt
    ) {
      uniqueById.set(session.id, session)
    }
  }

  return [...uniqueById.values()]
    .sort(
      (left, right) =>
        Date.parse(right.completedAt ?? '') - Date.parse(left.completedAt ?? ''),
    )
    .slice(0, MAX_EXAM_HISTORY)
}

export function migratePersistedState(persistedState: unknown): PersistedQuizState {
  if (!persistedState || typeof persistedState !== 'object') {
    return initialPersistedState
  }

  const state = persistedState as Partial<PersistedQuizState>
  const migratedHistory = Array.isArray(state.examHistory)
    ? state.examHistory
    : state.completedSession?.mode === 'full-exam' &&
        state.completedSession.status === 'completed'
      ? [state.completedSession]
      : []

  return {
    progressByQuestionId: state.progressByQuestionId ?? {},
    ...(state.activeSession ? { activeSession: state.activeSession } : {}),
    ...(state.completedSession
      ? { completedSession: state.completedSession }
      : {}),
    examHistory: orderAndLimitExamHistory(migratedHistory),
    ...(state.selectedPracticeModuleId
      ? { selectedPracticeModuleId: state.selectedPracticeModuleId }
      : {}),
  }
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      ...initialPersistedState,
      initialized: false,

      initialize: (provider) => {
        const state = get()
        let activeSession = state.activeSession
        let completedSession = state.completedSession
        const restoredHistory: QuizSession[] = []

        if (activeSession) {
          const restored = restoreQuizSession(
            serializeQuizSession(activeSession),
            provider,
          )
          if (!restored.ok) activeSession = undefined
        }
        if (completedSession) {
          const restored = restoreQuizSession(
            serializeQuizSession(completedSession),
            provider,
          )
          if (!restored.ok) completedSession = undefined
        }

        for (const historicalSession of state.examHistory) {
          const restored = restoreQuizSession(
            serializeQuizSession(historicalSession),
            provider,
          )
          if (
            restored.ok &&
            restored.value.mode === 'full-exam' &&
            restored.value.status === 'completed'
          ) {
            restoredHistory.push(restored.value)
          }
        }

        set({
          provider,
          initialized: true,
          activeSession,
          completedSession,
          examHistory: orderAndLimitExamHistory(restoredHistory),
        })
      },

      startFullExam: () => {
        const { provider, progressByQuestionId } = get()
        if (!provider) return false
        const result = createQuizSession({
          mode: 'full-exam',
          provider,
          progressByQuestionId,
          now: new Date(),
          createId: createSessionId,
        })
        if (!result.ok) {
          set({ actionError: messageForError(result.error.code) })
          return false
        }
        set({ activeSession: result.value, actionError: undefined })
        return true
      },

      startModulePractice: (moduleId) => {
        const { provider, progressByQuestionId } = get()
        if (!provider) return false
        const result = createQuizSession({
          mode: 'module-practice',
          moduleId,
          provider,
          progressByQuestionId,
          now: new Date(),
          createId: createSessionId,
        })
        if (!result.ok) {
          set({ actionError: messageForError(result.error.code) })
          return false
        }
        set({
          activeSession: result.value,
          selectedPracticeModuleId: moduleId,
          actionError: undefined,
        })
        return true
      },

      submitAnswer: (questionId, optionId) => {
        const { activeSession, provider, progressByQuestionId } = get()
        if (!activeSession || !provider) return false
        const result = submitQuizAnswer({
          session: activeSession,
          provider,
          progressByQuestionId,
          questionId,
          selectedOptionId: optionId,
          now: new Date(),
        })
        if (!result.ok) {
          set({ actionError: messageForError(result.error.code) })
          return false
        }
        set({
          activeSession: result.value.session,
          progressByQuestionId: result.value.progressByQuestionId,
          actionError: undefined,
        })
        return true
      },

      advance: () => {
        const { activeSession, examHistory } = get()
        if (!activeSession) return 'error'
        const result = advanceQuizSession({ session: activeSession, now: new Date() })
        if (!result.ok) {
          set({ actionError: messageForError(result.error.code) })
          return 'error'
        }
        if (result.value.status === 'completed') {
          const nextHistory =
            result.value.mode === 'full-exam'
              ? orderAndLimitExamHistory([result.value, ...examHistory])
              : examHistory
          set({
            activeSession: undefined,
            completedSession: result.value,
            examHistory: nextHistory,
            actionError: undefined,
          })
          return 'completed'
        }
        set({ activeSession: result.value, actionError: undefined })
        return 'advanced'
      },

      abandonActiveSession: () => set({ activeSession: undefined, actionError: undefined }),
      clearCompletedSession: () => set({ completedSession: undefined }),
      clearActionError: () => set({ actionError: undefined }),
      applyCloudState: (progressByQuestionId, examHistory) =>
        set({
          progressByQuestionId,
          examHistory: orderAndLimitExamHistory(examHistory),
          persistenceWarning: undefined,
        }),
      resetLocalQuizData: () =>
        set({
          ...initialPersistedState,
          activeSession: undefined,
          completedSession: undefined,
          selectedPracticeModuleId: undefined,
          actionError: undefined,
          persistenceWarning: undefined,
        }),
      setPersistenceWarning: (persistenceWarning) =>
        set({ persistenceWarning }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedQuizState => ({
        progressByQuestionId: state.progressByQuestionId,
        activeSession: state.activeSession,
        completedSession: state.completedSession,
        examHistory: state.examHistory,
        selectedPracticeModuleId: state.selectedPracticeModuleId,
      }),
      migrate: (persistedState) => migratePersistedState(persistedState),
    },
  ),
)

export { MAX_EXAM_HISTORY, STORAGE_KEY, STORAGE_VERSION }
