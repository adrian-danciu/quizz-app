import { describe, expect, it } from 'vitest'

import { selectWeightedQuestions } from './weightedSelection'
import type { QuizQuestion } from './quizTypes'

function question(id: string): QuizQuestion {
  return {
    id,
    moduleId: 'module-a',
    content: [{ type: 'text', value: id }],
    options: [{ id: 'a', content: [{ type: 'text', value: 'A' }] }],
    correctOptionId: 'a',
  }
}

describe('selectWeightedQuestions', () => {
  const questions = [question('q-1'), question('q-2'), question('q-3')]

  it('is reproducible with injected random values and stable input order', () => {
    const values = [0, 0.99]

    const selected = selectWeightedQuestions({
      questions,
      count: 2,
      now: '2026-06-18T12:00:00.000Z',
      random: () => values.shift() ?? 0,
    })

    expect(selected.map(({ id }) => id)).toEqual(['q-1', 'q-3'])
  })

  it('caps the count to available questions without duplicates', () => {
    const selected = selectWeightedQuestions({
      questions,
      count: 10,
      now: '2026-06-18T12:00:00.000Z',
      random: () => 0,
    })

    expect(selected.map(({ id }) => id)).toEqual(['q-1', 'q-2', 'q-3'])
    expect(new Set(selected.map(({ id }) => id)).size).toBe(3)
  })

  it('uses progress weights when drawing candidates', () => {
    const selected = selectWeightedQuestions({
      questions: questions.slice(0, 2),
      progressByQuestionId: {
        'q-1': {
          questionId: 'q-1',
          seenCount: 10,
          correctCount: 10,
          wrongCount: 0,
          lastAnsweredCorrectly: true,
        },
      },
      count: 1,
      now: '2026-06-18T12:00:00.000Z',
      random: () => 0.5,
    })

    expect(selected[0].id).toBe('q-2')
  })

  it('rejects duplicate candidates and malformed random functions', () => {
    expect(() =>
      selectWeightedQuestions({
        questions: [questions[0], questions[0]],
        count: 1,
        now: '2026-06-18T12:00:00.000Z',
      }),
    ).toThrow(/Duplicate question ID/)

    expect(() =>
      selectWeightedQuestions({
        questions,
        count: 1,
        now: '2026-06-18T12:00:00.000Z',
        random: () => 1,
      }),
    ).toThrow(/\[0, 1\)/)
  })
})
