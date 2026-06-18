import { describe, expect, it } from 'vitest'

import { calculateQuestionWeight } from './questionWeight'
import type { QuestionProgress } from './quizTypes'

const now = '2026-06-18T12:00:00.000Z'

function progress(
  overrides: Partial<QuestionProgress> = {},
): QuestionProgress {
  return {
    questionId: 'q-1',
    seenCount: 1,
    correctCount: 0,
    wrongCount: 0,
    ...overrides,
  }
}

describe('calculateQuestionWeight', () => {
  it('gives unseen questions the 100-point unseen bonus', () => {
    expect(calculateQuestionWeight(undefined, now)).toBe(110)
  })

  it('combines last-wrong, accumulated wrong, and correct-answer terms', () => {
    expect(
      calculateQuestionWeight(
        progress({
          lastAnsweredCorrectly: false,
          wrongCount: 2,
          correctCount: 1,
        }),
        now,
      ),
    ).toBe(102)
  })

  it('applies a 40-point penalty inside 24 hours', () => {
    expect(
      calculateQuestionWeight(
        progress({ lastSeenAt: '2026-06-18T11:00:00.000Z' }),
        now,
      ),
    ).toBe(1)
  })

  it('applies a 20-point penalty from 24 hours through 7 days', () => {
    expect(
      calculateQuestionWeight(
        progress({
          wrongCount: 1,
          lastSeenAt: '2026-06-17T12:00:00.000Z',
        }),
        now,
      ),
    ).toBe(15)
    expect(
      calculateQuestionWeight(
        progress({
          wrongCount: 1,
          lastSeenAt: '2026-06-11T12:00:00.000Z',
        }),
        now,
      ),
    ).toBe(15)
  })

  it('ignores old, future, and invalid timestamps', () => {
    expect(
      calculateQuestionWeight(
        progress({ lastSeenAt: '2026-06-10T11:59:59.000Z' }),
        now,
      ),
    ).toBe(10)
    expect(
      calculateQuestionWeight(
        progress({ lastSeenAt: '2026-06-19T12:00:00.000Z' }),
        now,
      ),
    ).toBe(10)
    expect(
      calculateQuestionWeight(progress({ lastSeenAt: 'not-a-date' }), now),
    ).toBe(10)
  })

  it('clamps mastered or very recent questions to a minimum of one', () => {
    expect(
      calculateQuestionWeight(
        progress({
          correctCount: 20,
          lastAnsweredCorrectly: true,
          lastSeenAt: '2026-06-18T11:00:00.000Z',
        }),
        now,
      ),
    ).toBe(1)
  })
})
