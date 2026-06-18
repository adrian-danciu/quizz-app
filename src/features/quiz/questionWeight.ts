import type { QuestionProgress } from './quizTypes'

const HOUR_IN_MS = 60 * 60 * 1000
const DAY_IN_MS = 24 * HOUR_IN_MS
const WEEK_IN_MS = 7 * DAY_IN_MS

function toTimestamp(value: Date | string | number): number {
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime()

  if (!Number.isFinite(timestamp)) {
    throw new Error('The supplied current time is invalid.')
  }

  return timestamp
}

function calculateRecencyPenalty(
  lastSeenAt: string | undefined,
  nowTimestamp: number,
): number {
  if (!lastSeenAt) {
    return 0
  }

  const lastSeenTimestamp = Date.parse(lastSeenAt)
  if (!Number.isFinite(lastSeenTimestamp)) {
    return 0
  }

  const elapsed = nowTimestamp - lastSeenTimestamp
  if (elapsed >= 0 && elapsed < DAY_IN_MS) {
    return 40
  }

  if (elapsed >= DAY_IN_MS && elapsed <= WEEK_IN_MS) {
    return 20
  }

  return 0
}

export function calculateQuestionWeight(
  progress: QuestionProgress | undefined,
  now: Date | string | number,
): number {
  const nowTimestamp = toTimestamp(now)

  if (!progress) {
    return 110
  }

  const weight =
    10 +
    (progress.lastAnsweredCorrectly === false ? 50 : 0) +
    25 * progress.wrongCount -
    8 * progress.correctCount -
    calculateRecencyPenalty(progress.lastSeenAt, nowTimestamp)

  return Math.max(1, weight)
}
