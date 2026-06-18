import { describe, expect, it } from 'vitest'
import { orderResponsesForReview } from './resultsReview'

describe('orderResponsesForReview', () => {
  it('puts incorrect answers first and preserves quiz order within both groups', () => {
    const response = (questionId: string, isCorrect: boolean) => ({
      questionId, isCorrect, selectedOptionId: 'a', answeredAt: '2026-06-18T12:00:00.000Z',
    })
    const ordered = orderResponsesForReview(
      [response('q-1', true), response('q-2', false), response('q-3', true), response('q-4', false)],
      ['q-1', 'q-2', 'q-3', 'q-4'],
    )

    expect(ordered.map(({ questionId }) => questionId)).toEqual(['q-2', 'q-4', 'q-1', 'q-3'])
  })
})
