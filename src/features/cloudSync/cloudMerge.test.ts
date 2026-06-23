import { describe, expect, it } from 'vitest'
import { InMemoryQuestionProvider, type QuizQuestion, type QuizSession } from '../quiz'
import { mergeExamHistory, mergeQuestionProgress } from './cloudMerge'
import type { ExamSessionRow, QuestionProgressRow } from './cloudTypes'

const question: QuizQuestion = {
  id: 'q-1',
  moduleId: 'module-a',
  content: [{ type: 'text', value: 'Întrebare' }],
  options: [
    { id: 'a', content: [{ type: 'text', value: 'A' }] },
    { id: 'b', content: [{ type: 'text', value: 'B' }] },
  ],
  correctOptionId: 'b',
}

const provider = new InMemoryQuestionProvider([question], ['module-a'])

function completedExam(id: string, completedAt: string): QuizSession {
  return {
    id,
    mode: 'full-exam',
    questionIds: ['q-1'],
    currentIndex: 0,
    responses: [{
      questionId: 'q-1',
      selectedOptionId: 'b',
      isCorrect: true,
      answeredAt: completedAt,
    }],
    status: 'completed',
    feedbackPolicy: 'after-session',
    startedAt: completedAt,
    completedAt,
  }
}

function examRow(session: QuizSession): ExamSessionRow {
  return {
    user_id: 'user-1',
    session_id: session.id,
    completed_at: session.completedAt!,
    session,
    updated_at: session.completedAt!,
  }
}

describe('cloud merge', () => {
  it('unions exam history by ID, prefers the newest copy, and ignores invalid cloud sessions', () => {
    const local = completedExam('same', '2026-06-20T10:00:00.000Z')
    const newerCloud = completedExam('same', '2026-06-21T10:00:00.000Z')
    const cloudOnly = completedExam('cloud-only', '2026-06-22T10:00:00.000Z')
    const invalid = { ...examRow(cloudOnly), session_id: 'invalid', session: { nope: true } }

    const merged = mergeExamHistory(
      [local],
      [examRow(newerCloud), examRow(cloudOnly), invalid],
      provider,
    )

    expect(merged.map(({ id }) => id)).toEqual(['cloud-only', 'same'])
    expect(merged[1].completedAt).toBe('2026-06-21T10:00:00.000Z')
  })

  it('chooses the newest complete progress snapshot without adding counters', () => {
    const cloudRow: QuestionProgressRow = {
      user_id: 'user-1',
      question_id: 'q-1',
      seen_count: 3,
      correct_count: 2,
      wrong_count: 1,
      last_seen_at: '2026-06-22T10:00:00.000Z',
      last_answered_correctly: true,
      updated_at: '2026-06-22T10:00:00.000Z',
    }
    const merged = mergeQuestionProgress(
      {
        'q-1': {
          questionId: 'q-1',
          seenCount: 9,
          correctCount: 4,
          wrongCount: 5,
          lastSeenAt: '2026-06-20T10:00:00.000Z',
        },
      },
      [cloudRow],
    )

    expect(merged['q-1']).toMatchObject({
      seenCount: 3,
      correctCount: 2,
      wrongCount: 1,
      lastAnsweredCorrectly: true,
    })
  })
})
