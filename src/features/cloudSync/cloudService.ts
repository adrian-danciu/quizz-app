import type { SupabaseClient } from '@supabase/supabase-js'
import type { QuestionProgress, QuizSession } from '../quiz'
import type {
  CloudQuizState,
  ExamSessionRow,
  QuestionProgressRow,
} from './cloudTypes'

export async function fetchCloudQuizState(
  client: SupabaseClient,
  userId: string,
): Promise<CloudQuizState> {
  const [examResult, progressResult] = await Promise.all([
    client
      .from('exam_sessions')
      .select('user_id, session_id, completed_at, session, updated_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(50),
    client
      .from('question_progress')
      .select('user_id, question_id, seen_count, correct_count, wrong_count, last_seen_at, last_answered_correctly, updated_at')
      .eq('user_id', userId),
  ])

  if (examResult.error) throw examResult.error
  if (progressResult.error) throw progressResult.error

  return {
    exams: (examResult.data ?? []) as ExamSessionRow[],
    progress: (progressResult.data ?? []) as QuestionProgressRow[],
  }
}

export async function upsertExamHistory(
  client: SupabaseClient,
  userId: string,
  sessions: readonly QuizSession[],
): Promise<void> {
  if (sessions.length === 0) return
  const now = new Date().toISOString()
  const rows = sessions.map((session) => ({
    user_id: userId,
    session_id: session.id,
    completed_at: session.completedAt,
    session,
    updated_at: now,
  }))
  const { error } = await client
    .from('exam_sessions')
    .upsert(rows, { onConflict: 'user_id,session_id' })
  if (error) throw error
}

export async function pruneExamHistory(
  client: SupabaseClient,
  userId: string,
  keepIds: readonly string[],
): Promise<void> {
  const { data, error } = await client
    .from('exam_sessions')
    .select('session_id')
    .eq('user_id', userId)
  if (error) throw error

  const staleIds = (data ?? [])
    .map(({ session_id }) => session_id as string)
    .filter((id) => !keepIds.includes(id))
  if (staleIds.length === 0) return

  const deleteResult = await client
    .from('exam_sessions')
    .delete()
    .eq('user_id', userId)
    .in('session_id', staleIds)
  if (deleteResult.error) throw deleteResult.error
}

export async function upsertQuestionProgress(
  client: SupabaseClient,
  userId: string,
  progress: readonly QuestionProgress[],
): Promise<void> {
  if (progress.length === 0) return
  const now = new Date().toISOString()
  const rows = progress.map((entry) => ({
    user_id: userId,
    question_id: entry.questionId,
    seen_count: entry.seenCount,
    correct_count: entry.correctCount,
    wrong_count: entry.wrongCount,
    last_seen_at: entry.lastSeenAt ?? null,
    last_answered_correctly: entry.lastAnsweredCorrectly ?? null,
    updated_at: now,
  }))
  const { error } = await client
    .from('question_progress')
    .upsert(rows, { onConflict: 'user_id,question_id' })
  if (error) throw error
}
