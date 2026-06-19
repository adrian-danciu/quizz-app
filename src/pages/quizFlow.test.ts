import { describe, expect, it } from 'vitest'
import { getQuizPrimaryAction, getQuizPrimaryLabel } from './quizFlow'

describe('quiz primary action', () => {
  it('pauses practice after submission so feedback remains visible', () => {
    expect(getQuizPrimaryAction(false, 'after-answer')).toBe('submit')
    expect(getQuizPrimaryLabel(false, 'after-answer', false)).toBe(
      'Confirmă răspunsul',
    )
    expect(getQuizPrimaryAction(true, 'after-answer')).toBe('advance')
    expect(getQuizPrimaryLabel(true, 'after-answer', false)).toBe(
      'Întrebarea următoare',
    )
  })

  it('submits and advances a full exam without revealing feedback', () => {
    expect(getQuizPrimaryAction(false, 'after-session')).toBe(
      'submit-and-advance',
    )
    expect(getQuizPrimaryLabel(false, 'after-session', true)).toBe(
      'Vezi rezultatele',
    )
  })
})
