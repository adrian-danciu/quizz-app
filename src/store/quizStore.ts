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
const STORAGE_VERSION = 1

type PersistedQuizState = {
  progressByQuestionId: ProgressByQuestionId
  activeSession?: QuizSession
  completedSession?: QuizSession
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

        set({ provider, initialized: true, activeSession, completedSession })
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
        const { activeSession } = get()
        if (!activeSession) return 'error'
        const result = advanceQuizSession({ session: activeSession, now: new Date() })
        if (!result.ok) {
          set({ actionError: messageForError(result.error.code) })
          return 'error'
        }
        if (result.value.status === 'completed') {
          set({
            activeSession: undefined,
            completedSession: result.value,
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
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedQuizState => ({
        progressByQuestionId: state.progressByQuestionId,
        activeSession: state.activeSession,
        completedSession: state.completedSession,
        selectedPracticeModuleId: state.selectedPracticeModuleId,
      }),
      migrate: (persistedState) =>
        (persistedState as PersistedQuizState | undefined) ?? initialPersistedState,
    },
  ),
)

export { STORAGE_KEY, STORAGE_VERSION }
