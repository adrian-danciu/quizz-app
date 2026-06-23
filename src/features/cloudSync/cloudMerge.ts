import {
  restoreQuizSession,
  type ProgressByQuestionId,
  type QuestionProgress,
  type QuestionProvider,
  type QuizSession,
} from '../quiz'
import { MAX_EXAM_HISTORY } from '../../store/quizStore'
import type {
  ExamSessionRow,
  MergedQuizState,
  QuestionProgressRow,
} from './cloudTypes'

function timestamp(value?: string | null): number {
  const parsed = value ? Date.parse(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY
}

function validCloudSession(
  row: ExamSessionRow,
  provider: QuestionProvider,
): QuizSession | undefined {
  let serialized: string
  try {
    serialized = JSON.stringify(row.session)
  } catch {
    return undefined
  }

  const restored = restoreQuizSession(serialized, provider)
  if (
    !restored.ok ||
    restored.value.mode !== 'full-exam' ||
    restored.value.status !== 'completed'
  ) {
    return undefined
  }
  return restored.value
}

export function mergeExamHistory(
  localHistory: readonly QuizSession[],
  cloudRows: readonly ExamSessionRow[],
  provider: QuestionProvider,
): QuizSession[] {
  const sessions = new Map<string, QuizSession>()

  for (const session of localHistory) {
    if (session.mode === 'full-exam' && session.status === 'completed') {
      sessions.set(session.id, session)
    }
  }

  for (const row of cloudRows) {
    const cloudSession = validCloudSession(row, provider)
    if (!cloudSession) continue
    const localSession = sessions.get(cloudSession.id)
    if (
      !localSession ||
      timestamp(cloudSession.completedAt) > timestamp(localSession.completedAt)
    ) {
      sessions.set(cloudSession.id, cloudSession)
    }
  }

  return [...sessions.values()]
    .sort(
      (left, right) =>
        timestamp(right.completedAt) - timestamp(left.completedAt),
    )
    .slice(0, MAX_EXAM_HISTORY)
}

export function progressFromRow(row: QuestionProgressRow): QuestionProgress {
  return {
    questionId: row.question_id,
    seenCount: row.seen_count,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    ...(row.last_seen_at ? { lastSeenAt: row.last_seen_at } : {}),
    ...(row.last_answered_correctly === null
      ? {}
      : { lastAnsweredCorrectly: row.last_answered_correctly }),
  }
}

export function mergeQuestionProgress(
  localProgress: ProgressByQuestionId,
  cloudRows: readonly QuestionProgressRow[],
): ProgressByQuestionId {
  const merged: Record<string, QuestionProgress> = { ...localProgress }

  for (const row of cloudRows) {
    const cloudProgress = progressFromRow(row)
    const local = merged[row.question_id]
    if (!local || timestamp(cloudProgress.lastSeenAt) > timestamp(local.lastSeenAt)) {
      merged[row.question_id] = cloudProgress
    }
  }

  return merged
}

export function mergeQuizState(
  localHistory: readonly QuizSession[],
  localProgress: ProgressByQuestionId,
  cloudExams: readonly ExamSessionRow[],
  cloudProgress: readonly QuestionProgressRow[],
  provider: QuestionProvider,
): MergedQuizState {
  return {
    examHistory: mergeExamHistory(localHistory, cloudExams, provider),
    progressByQuestionId: mergeQuestionProgress(localProgress, cloudProgress),
  }
}
