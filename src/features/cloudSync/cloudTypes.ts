import type { QuizSession } from '../quiz'

export type ExamSessionRow = {
  user_id: string
  session_id: string
  completed_at: string
  session: unknown
  updated_at: string
}

export type QuestionProgressRow = {
  user_id: string
  question_id: string
  seen_count: number
  correct_count: number
  wrong_count: number
  last_seen_at: string | null
  last_answered_correctly: boolean | null
  updated_at: string
}

export type CloudQuizState = {
  exams: ExamSessionRow[]
  progress: QuestionProgressRow[]
}

export type MergedQuizState = {
  examHistory: QuizSession[]
  progressByQuestionId: import('../quiz').ProgressByQuestionId
}
