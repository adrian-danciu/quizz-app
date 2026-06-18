import { createContext, useContext } from 'react'
import type { ModuleSummary, QuestionDataset } from '../data/questionDataset'
import type { InMemoryQuestionProvider } from '../features/quiz'

export type QuestionDataContextValue = {
  dataset?: QuestionDataset
  modules: ModuleSummary[]
  provider?: InMemoryQuestionProvider
  loading: boolean
  error?: string
  retry: () => void
}

export const QuestionDataContext = createContext<QuestionDataContextValue | null>(null)

export function useQuestionData(): QuestionDataContextValue {
  const context = useContext(QuestionDataContext)
  if (!context) {
    throw new Error('useQuestionData must be used inside QuestionDataProvider.')
  }
  return context
}
