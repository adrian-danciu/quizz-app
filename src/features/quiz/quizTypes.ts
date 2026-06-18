export type TextContentBlock = {
  type: 'text'
  value: string
}

export type CodeContentBlock = {
  type: 'code'
  value: string
  language?: string
}

export type ImageContentBlock = {
  type: 'image'
  src: string
  alt?: string
}

export type ContentBlock =
  | TextContentBlock
  | CodeContentBlock
  | ImageContentBlock

export type QuizOption = {
  id: string
  content: ContentBlock[]
}

export type QuizQuestion = {
  id: string
  moduleId: string
  content: ContentBlock[]
  options: QuizOption[]
  correctOptionId: string
  explanation?: ContentBlock[] | null
  source?: {
    page?: number
    questionNumber?: number
  }
}

export type QuestionProgress = {
  questionId: string
  seenCount: number
  correctCount: number
  wrongCount: number
  lastSeenAt?: string
  lastAnsweredCorrectly?: boolean
}

export type QuizMode = 'full-exam' | 'module-practice'
export type FeedbackPolicy = 'after-session' | 'after-answer'
export type QuizSessionStatus = 'active' | 'completed'

export type QuizResponse = {
  questionId: string
  selectedOptionId: string
  isCorrect: boolean
  answeredAt: string
}

export type QuizSession = {
  id: string
  mode: QuizMode
  moduleId?: string
  questionIds: string[]
  currentIndex: number
  responses: QuizResponse[]
  status: QuizSessionStatus
  feedbackPolicy: FeedbackPolicy
  startedAt: string
  completedAt?: string
}

export type QuizResult = {
  totalQuestions: number
  answeredQuestions: number
  correctAnswers: number
  wrongAnswers: number
  percentage: number
  quarterPoints: number
  score: number
  wrongQuestionIds: string[]
}

export type QuizEngineErrorCode =
  | 'unknown-module'
  | 'insufficient-exam-questions'
  | 'empty-practice-module'
  | 'inactive-session'
  | 'mismatched-current-question'
  | 'invalid-option'
  | 'duplicate-answer'
  | 'advance-before-answer'
  | 'missing-restored-question'
  | 'invalid-serialized-session'

export type QuizEngineError = {
  code: QuizEngineErrorCode
  message: string
}

export type EngineResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: QuizEngineError }

export type ProgressByQuestionId = Readonly<Record<string, QuestionProgress>>
