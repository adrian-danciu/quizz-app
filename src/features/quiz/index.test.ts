import { describe, expect, it } from 'vitest'

import {
  InMemoryQuestionProvider,
  calculateQuestionWeight,
  calculateQuizResult,
  createQuizSession,
  selectWeightedQuestions,
  updateQuestionProgress,
} from './index'

describe('quiz engine public API', () => {
  it('exports the core integration surface from one module', () => {
    expect(InMemoryQuestionProvider).toBeTypeOf('function')
    expect(calculateQuestionWeight).toBeTypeOf('function')
    expect(selectWeightedQuestions).toBeTypeOf('function')
    expect(updateQuestionProgress).toBeTypeOf('function')
    expect(calculateQuizResult).toBeTypeOf('function')
    expect(createQuizSession).toBeTypeOf('function')
  })
})
