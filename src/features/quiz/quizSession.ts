import type { QuestionProvider } from './questionProvider'
import { updateQuestionProgress } from './progressUpdate'
import { selectWeightedQuestions } from './weightedSelection'
import type {
  ContentBlock,
  EngineResult,
  ProgressByQuestionId,
  QuestionProgress,
  QuizMode,
  QuizQuestion,
  QuizResponse,
  QuizSession,
} from './quizTypes'

const FULL_EXAM_QUESTION_COUNT = 36

type TimeValue = Date | string | number

export type CreateQuizSessionOptions = {
  mode: QuizMode
  provider: QuestionProvider
  progressByQuestionId?: ProgressByQuestionId
  moduleId?: string
  now: TimeValue
  createId: () => string
  random?: () => number
}

export type AnswerFeedback = {
  isCorrect: boolean
  correctOptionId: string
  explanation?: ContentBlock[]
}

export type SubmitQuizAnswerValue = {
  session: QuizSession
  response: QuizResponse
  progressByQuestionId: Readonly<Record<string, QuestionProgress>>
  feedback?: AnswerFeedback
}

export type SubmitQuizAnswerOptions = {
  session: QuizSession
  provider: QuestionProvider
  progressByQuestionId?: ProgressByQuestionId
  questionId: string
  selectedOptionId: string
  now: TimeValue
}

export type AdvanceQuizSessionOptions = {
  session: QuizSession
  now: TimeValue
}

function toIsoString(value: TimeValue): string {
  const date = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(date.getTime())) {
    throw new Error('The supplied time is invalid.')
  }
  return date.toISOString()
}

function error<T>(
  code:
    | 'unknown-module'
    | 'insufficient-exam-questions'
    | 'empty-practice-module'
    | 'inactive-session'
    | 'mismatched-current-question'
    | 'invalid-option'
    | 'duplicate-answer'
    | 'advance-before-answer'
    | 'missing-restored-question'
    | 'invalid-serialized-session',
  message: string,
): EngineResult<T> {
  return { ok: false, error: { code, message } }
}

function success<T>(value: T): EngineResult<T> {
  return { ok: true, value }
}

function getCandidates(
  options: CreateQuizSessionOptions,
): EngineResult<readonly QuizQuestion[]> {
  if (options.mode === 'full-exam') {
    const candidates = options.provider.getAll()
    if (candidates.length < FULL_EXAM_QUESTION_COUNT) {
      return error(
        'insufficient-exam-questions',
        `Full Exam requires at least ${FULL_EXAM_QUESTION_COUNT} questions.`,
      )
    }
    return success(candidates)
  }

  if (!options.moduleId || !options.provider.hasModule(options.moduleId)) {
    return error('unknown-module', 'Choose a valid practice module.')
  }

  const candidates = options.provider.getByModuleId(options.moduleId)
  if (candidates.length === 0) {
    return error(
      'empty-practice-module',
      'The selected practice module has no questions.',
    )
  }

  return success(candidates)
}

export function createQuizSession(
  options: CreateQuizSessionOptions,
): EngineResult<QuizSession> {
  const candidateResult = getCandidates(options)
  if (!candidateResult.ok) {
    return candidateResult
  }

  const requestedCount =
    options.mode === 'full-exam'
      ? FULL_EXAM_QUESTION_COUNT
      : Math.min(FULL_EXAM_QUESTION_COUNT, candidateResult.value.length)
  const selected = selectWeightedQuestions({
    questions: candidateResult.value,
    progressByQuestionId: options.progressByQuestionId,
    count: requestedCount,
    now: options.now,
    random: options.random,
  })

  return success({
    id: options.createId(),
    mode: options.mode,
    ...(options.mode === 'module-practice'
      ? { moduleId: options.moduleId }
      : {}),
    questionIds: selected.map(({ id }) => id),
    currentIndex: 0,
    responses: [],
    status: 'active',
    feedbackPolicy:
      options.mode === 'full-exam' ? 'after-session' : 'after-answer',
    startedAt: toIsoString(options.now),
  })
}

export function submitQuizAnswer({
  session,
  provider,
  progressByQuestionId = {},
  questionId,
  selectedOptionId,
  now,
}: SubmitQuizAnswerOptions): EngineResult<SubmitQuizAnswerValue> {
  if (session.status !== 'active') {
    return error('inactive-session', 'This quiz session is already completed.')
  }

  const currentQuestionId = session.questionIds[session.currentIndex]
  if (questionId !== currentQuestionId) {
    return error(
      'mismatched-current-question',
      'The answer does not belong to the current question.',
    )
  }

  if (session.responses.some((response) => response.questionId === questionId)) {
    return error('duplicate-answer', 'This question has already been answered.')
  }

  const question = provider.getById(questionId)
  if (!question) {
    return error(
      'mismatched-current-question',
      'The current question is no longer available.',
    )
  }

  if (!question.options.some((option) => option.id === selectedOptionId)) {
    return error(
      'invalid-option',
      'The selected option does not belong to this question.',
    )
  }

  const answeredAt = toIsoString(now)
  const response: QuizResponse = {
    questionId,
    selectedOptionId,
    isCorrect: selectedOptionId === question.correctOptionId,
    answeredAt,
  }
  const updatedProgress = updateQuestionProgress(
    progressByQuestionId[questionId],
    {
      questionId,
      isCorrect: response.isCorrect,
      answeredAt,
    },
  )

  return success({
    session: {
      ...session,
      responses: [...session.responses, response],
    },
    response,
    progressByQuestionId: {
      ...progressByQuestionId,
      [questionId]: updatedProgress,
    },
    ...(session.feedbackPolicy === 'after-answer'
      ? {
          feedback: {
            isCorrect: response.isCorrect,
            correctOptionId: question.correctOptionId,
            ...(question.explanation
              ? { explanation: question.explanation }
              : {}),
          },
        }
      : {}),
  })
}

export function advanceQuizSession({
  session,
  now,
}: AdvanceQuizSessionOptions): EngineResult<QuizSession> {
  if (session.status !== 'active') {
    return error('inactive-session', 'This quiz session is already completed.')
  }

  const currentQuestionId = session.questionIds[session.currentIndex]
  const currentQuestionWasAnswered = session.responses.some(
    ({ questionId }) => questionId === currentQuestionId,
  )
  if (!currentQuestionWasAnswered) {
    return error(
      'advance-before-answer',
      'Answer the current question before continuing.',
    )
  }

  if (session.currentIndex === session.questionIds.length - 1) {
    return success({
      ...session,
      status: 'completed',
      completedAt: toIsoString(now),
    })
  }

  return success({
    ...session,
    currentIndex: session.currentIndex + 1,
  })
}

function isQuizSession(value: unknown): value is QuizSession {
  if (!value || typeof value !== 'object') {
    return false
  }

  const session = value as Partial<QuizSession>
  const hasValidModeDetails =
    (session.mode === 'full-exam' &&
      session.moduleId === undefined &&
      session.feedbackPolicy === 'after-session') ||
    (session.mode === 'module-practice' &&
      typeof session.moduleId === 'string' &&
      session.moduleId.length > 0 &&
      session.feedbackPolicy === 'after-answer')
  const responsesAreValid =
    Array.isArray(session.responses) &&
    session.responses.every(
      (response) =>
        response !== null &&
        typeof response === 'object' &&
        typeof response.questionId === 'string' &&
        typeof response.selectedOptionId === 'string' &&
        typeof response.isCorrect === 'boolean' &&
        typeof response.answeredAt === 'string',
    )
  const responseQuestionIds = responsesAreValid
    ? session.responses!.map(({ questionId }) => questionId)
    : []
  const hasUniqueResponses =
    new Set(responseQuestionIds).size === responseQuestionIds.length

  return (
    typeof session.id === 'string' &&
    hasValidModeDetails &&
    Array.isArray(session.questionIds) &&
    session.questionIds.length > 0 &&
    session.questionIds.every((id) => typeof id === 'string') &&
    new Set(session.questionIds).size === session.questionIds.length &&
    Number.isInteger(session.currentIndex) &&
    typeof session.currentIndex === 'number' &&
    session.currentIndex >= 0 &&
    session.currentIndex < session.questionIds.length &&
    responsesAreValid &&
    hasUniqueResponses &&
    responseQuestionIds.every((id) => session.questionIds!.includes(id)) &&
    (session.status === 'active' || session.status === 'completed') &&
    typeof session.startedAt === 'string' &&
    Number.isFinite(Date.parse(session.startedAt)) &&
    (session.status === 'active'
      ? session.completedAt === undefined
      : typeof session.completedAt === 'string' &&
        Number.isFinite(Date.parse(session.completedAt)))
  )
}

export function serializeQuizSession(session: QuizSession): string {
  return JSON.stringify(session)
}

export function restoreQuizSession(
  serializedSession: string,
  provider: QuestionProvider,
): EngineResult<QuizSession> {
  let parsed: unknown

  try {
    parsed = JSON.parse(serializedSession)
  } catch {
    return error(
      'invalid-serialized-session',
      'The saved quiz session is not valid JSON.',
    )
  }

  if (!isQuizSession(parsed)) {
    return error(
      'invalid-serialized-session',
      'The saved quiz session has an invalid structure.',
    )
  }

  const missingQuestionId = parsed.questionIds.find(
    (questionId) => !provider.getById(questionId),
  )
  if (missingQuestionId) {
    return error(
      'missing-restored-question',
      `The saved question "${missingQuestionId}" is no longer available.`,
    )
  }

  const hasInvalidResponse = parsed.responses.some((response) => {
    const question = provider.getById(response.questionId)
    return (
      !question ||
      !question.options.some(({ id }) => id === response.selectedOptionId) ||
      response.isCorrect !==
        (response.selectedOptionId === question.correctOptionId)
    )
  })
  if (hasInvalidResponse) {
    return error(
      'invalid-serialized-session',
      'The saved quiz responses are inconsistent with the question data.',
    )
  }

  return success(parsed)
}
