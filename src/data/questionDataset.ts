import type { QuizQuestion } from '../features/quiz'

export type ModuleSummary = {
  id: string
  name: string
  order: number
  questionCount: number
}

export type QuestionDataset = {
  schemaVersion: string
  modules: ModuleSummary[]
  questions: QuizQuestion[]
}

export function isQuestionDataset(value: unknown): value is QuestionDataset {
  if (!value || typeof value !== 'object') return false
  const dataset = value as Partial<QuestionDataset>

  return (
    Array.isArray(dataset.modules) &&
    dataset.modules.every(
      (module) =>
        typeof module?.id === 'string' &&
        typeof module.name === 'string' &&
        typeof module.questionCount === 'number',
    ) &&
    Array.isArray(dataset.questions) &&
    dataset.questions.every(
      (question) =>
        typeof question?.id === 'string' &&
        typeof question.moduleId === 'string' &&
        Array.isArray(question.content) &&
        Array.isArray(question.options) &&
        typeof question.correctOptionId === 'string',
    )
  )
}
