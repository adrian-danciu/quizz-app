import { describe, expect, it } from 'vitest'

import { updateQuestionProgress } from './progressUpdate'
import { calculateQuizResult } from './quizScoring'
import type { QuizResponse, QuizSession } from './quizTypes'

function session(responses: QuizResponse[], totalQuestions = 36): QuizSession {
  return {
    id: 'session-1',
    mode: 'full-exam',
    questionIds: Array.from(
      { length: totalQuestions },
      (_, index) => `q-${index + 1}`,
    ),
    currentIndex: Math.min(responses.length, totalQuestions - 1),
    responses,
    status: responses.length === totalQuestions ? 'completed' : 'active',
    feedbackPolicy: 'after-session',
    startedAt: '2026-06-18T12:00:00.000Z',
  }
}

function responses(correct: number, wrong: number): QuizResponse[] {
  return Array.from({ length: correct + wrong }, (_, index) => ({
    questionId: `q-${index + 1}`,
    selectedOptionId: 'a',
    isCorrect: index < correct,
    answeredAt: '2026-06-18T12:00:00.000Z',
  }))
}

describe('updateQuestionProgress', () => {
  it('creates first-seen progress and does not mutate existing progress', () => {
    const first = updateQuestionProgress(undefined, {
      questionId: 'q-1',
      isCorrect: false,
      answeredAt: '2026-06-18T12:00:00.000Z',
    })
    const snapshot = { ...first }
    const second = updateQuestionProgress(first, {
      questionId: 'q-1',
      isCorrect: true,
      answeredAt: '2026-06-19T12:00:00.000Z',
    })

    expect(first).toEqual(snapshot)
    expect(first).toMatchObject({
      seenCount: 1,
      correctCount: 0,
      wrongCount: 1,
      lastAnsweredCorrectly: false,
    })
    expect(second).toMatchObject({
      seenCount: 2,
      correctCount: 1,
      wrongCount: 1,
      lastSeenAt: '2026-06-19T12:00:00.000Z',
      lastAnsweredCorrectly: true,
    })
  })
})

describe('calculateQuizResult', () => {
  it('starts a 36-question exam at one point', () => {
    expect(calculateQuizResult(session([]))).toMatchObject({
      correctAnswers: 0,
      quarterPoints: 4,
      score: 1,
      percentage: 0,
    })
  })

  it('calculates partial score, percentage, and wrong IDs', () => {
    const result = calculateQuizResult(session(responses(18, 18)))

    expect(result).toMatchObject({
      totalQuestions: 36,
      answeredQuestions: 36,
      correctAnswers: 18,
      wrongAnswers: 18,
      percentage: 50,
      quarterPoints: 22,
      score: 5.5,
    })
    expect(result.wrongQuestionIds).toEqual(
      Array.from({ length: 18 }, (_, index) => `q-${index + 19}`),
    )
  })

  it('reaches ten points with all 36 answers correct', () => {
    expect(calculateQuizResult(session(responses(36, 0))).score).toBe(10)
  })
})
