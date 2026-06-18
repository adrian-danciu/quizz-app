import { describe, expect, it } from 'vitest'

import { InMemoryQuestionProvider } from './questionProvider'
import {
  advanceQuizSession,
  createQuizSession,
  restoreQuizSession,
  serializeQuizSession,
  submitQuizAnswer,
} from './quizSession'
import type { QuizQuestion, QuizSession } from './quizTypes'

const now = '2026-06-18T12:00:00.000Z'

function question(id: string, moduleId: string): QuizQuestion {
  return {
    id,
    moduleId,
    content: [{ type: 'text', value: id }],
    options: [
      { id: 'a', content: [{ type: 'text', value: 'A' }] },
      { id: 'b', content: [{ type: 'text', value: 'B' }] },
    ],
    correctOptionId: 'b',
    explanation: [{ type: 'text', value: `Explanation for ${id}` }],
  }
}

function examQuestions(count = 40): QuizQuestion[] {
  return Array.from({ length: count }, (_, index) =>
    question(`q-${index + 1}`, index % 2 === 0 ? 'module-a' : 'module-b'),
  )
}

function createExam(provider: InMemoryQuestionProvider): QuizSession {
  const result = createQuizSession({
    mode: 'full-exam',
    provider,
    now,
    createId: () => 'exam-1',
    random: () => 0,
  })
  if (!result.ok) {
    throw new Error(result.error.message)
  }
  return result.value
}

describe('createQuizSession', () => {
  it('creates a unique 36-question exam from the full cross-module pool', () => {
    const provider = new InMemoryQuestionProvider(examQuestions())
    const result = createQuizSession({
      mode: 'full-exam',
      provider,
      now,
      createId: () => 'exam-1',
      random: () => 0,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({
      id: 'exam-1',
      mode: 'full-exam',
      currentIndex: 0,
      responses: [],
      status: 'active',
      feedbackPolicy: 'after-session',
      startedAt: now,
    })
    expect(result.value.questionIds).toHaveLength(36)
    expect(new Set(result.value.questionIds)).toHaveLength(36)
    expect(
      new Set(
        result.value.questionIds.map(
          (id) => provider.getById(id)?.moduleId,
        ),
      ),
    ).toEqual(new Set(['module-a', 'module-b']))
  })

  it('rejects a full exam with fewer than 36 questions', () => {
    const result = createQuizSession({
      mode: 'full-exam',
      provider: new InMemoryQuestionProvider(examQuestions(35)),
      now,
      createId: () => 'exam-1',
    })

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'insufficient-exam-questions' },
    })
  })

  it('filters practice to one module and uses every question when under 36', () => {
    const provider = new InMemoryQuestionProvider([
      question('a-1', 'module-a'),
      question('a-2', 'module-a'),
      question('b-1', 'module-b'),
    ])
    const result = createQuizSession({
      mode: 'module-practice',
      moduleId: 'module-a',
      provider,
      now,
      createId: () => 'practice-1',
      random: () => 0,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({
      mode: 'module-practice',
      moduleId: 'module-a',
      feedbackPolicy: 'after-answer',
    })
    expect(result.value.questionIds).toEqual(['a-1', 'a-2'])
  })

  it('distinguishes an unknown module from a known empty module', () => {
    const provider = new InMemoryQuestionProvider([], ['empty-module'])

    expect(
      createQuizSession({
        mode: 'module-practice',
        moduleId: 'missing-module',
        provider,
        now,
        createId: () => 'practice-1',
      }),
    ).toMatchObject({ ok: false, error: { code: 'unknown-module' } })
    expect(
      createQuizSession({
        mode: 'module-practice',
        moduleId: 'empty-module',
        provider,
        now,
        createId: () => 'practice-1',
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'empty-practice-module' },
    })
  })
})

describe('submitQuizAnswer', () => {
  it('records an answer and progress once without advancing the index', () => {
    const provider = new InMemoryQuestionProvider(examQuestions())
    const session = createExam(provider)
    const previousProgress = {
      'q-1': {
        questionId: 'q-1',
        seenCount: 1,
        correctCount: 0,
        wrongCount: 1,
        lastAnsweredCorrectly: false,
      },
    }
    const result = submitQuizAnswer({
      session,
      provider,
      progressByQuestionId: previousProgress,
      questionId: 'q-1',
      selectedOptionId: 'b',
      now,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(session.responses).toEqual([])
    expect(previousProgress['q-1'].seenCount).toBe(1)
    expect(result.value.session.currentIndex).toBe(0)
    expect(result.value.session.responses).toHaveLength(1)
    expect(result.value.progressByQuestionId['q-1']).toMatchObject({
      seenCount: 2,
      correctCount: 1,
      wrongCount: 1,
      lastAnsweredCorrectly: true,
    })
    expect(result.value.feedback).toBeUndefined()
  })

  it('reveals correctness, correct option, and explanation during practice', () => {
    const provider = new InMemoryQuestionProvider([
      question('a-1', 'module-a'),
    ])
    const created = createQuizSession({
      mode: 'module-practice',
      moduleId: 'module-a',
      provider,
      now,
      createId: () => 'practice-1',
      random: () => 0,
    })
    if (!created.ok) throw new Error(created.error.message)

    const result = submitQuizAnswer({
      session: created.value,
      provider,
      questionId: 'a-1',
      selectedOptionId: 'a',
      now,
    })

    expect(result).toMatchObject({
      ok: true,
      value: {
        feedback: {
          isCorrect: false,
          correctOptionId: 'b',
          explanation: [{ type: 'text', value: 'Explanation for a-1' }],
        },
      },
    })
  })

  it('returns typed errors for invalid user actions', () => {
    const provider = new InMemoryQuestionProvider(examQuestions())
    const session = createExam(provider)

    expect(
      submitQuizAnswer({
        session,
        provider,
        questionId: 'q-2',
        selectedOptionId: 'b',
        now,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'mismatched-current-question' },
    })
    expect(
      submitQuizAnswer({
        session,
        provider,
        questionId: 'q-1',
        selectedOptionId: 'z',
        now,
      }),
    ).toMatchObject({ ok: false, error: { code: 'invalid-option' } })

    const first = submitQuizAnswer({
      session,
      provider,
      questionId: 'q-1',
      selectedOptionId: 'b',
      now,
    })
    if (!first.ok) throw new Error(first.error.message)
    expect(
      submitQuizAnswer({
        session: first.value.session,
        provider,
        questionId: 'q-1',
        selectedOptionId: 'b',
        now,
      }),
    ).toMatchObject({ ok: false, error: { code: 'duplicate-answer' } })
  })
})

describe('advanceQuizSession', () => {
  it('requires an answer, then advances to the next question', () => {
    const provider = new InMemoryQuestionProvider(examQuestions())
    const session = createExam(provider)

    expect(advanceQuizSession({ session, now })).toMatchObject({
      ok: false,
      error: { code: 'advance-before-answer' },
    })
    const answered = submitQuizAnswer({
      session,
      provider,
      questionId: 'q-1',
      selectedOptionId: 'b',
      now,
    })
    if (!answered.ok) throw new Error(answered.error.message)

    expect(
      advanceQuizSession({ session: answered.value.session, now }),
    ).toMatchObject({ ok: true, value: { currentIndex: 1, status: 'active' } })
  })

  it('completes after the final answered question and rejects another advance', () => {
    const oneQuestionSession: QuizSession = {
      id: 'practice-1',
      mode: 'module-practice',
      moduleId: 'module-a',
      questionIds: ['q-1'],
      currentIndex: 0,
      responses: [
        {
          questionId: 'q-1',
          selectedOptionId: 'b',
          isCorrect: true,
          answeredAt: now,
        },
      ],
      status: 'active',
      feedbackPolicy: 'after-answer',
      startedAt: now,
    }
    const completed = advanceQuizSession({
      session: oneQuestionSession,
      now: '2026-06-18T12:05:00.000Z',
    })

    expect(completed).toMatchObject({
      ok: true,
      value: {
        status: 'completed',
        completedAt: '2026-06-18T12:05:00.000Z',
      },
    })
    if (!completed.ok) return
    expect(advanceQuizSession({ session: completed.value, now })).toMatchObject({
      ok: false,
      error: { code: 'inactive-session' },
    })
  })
})

describe('quiz session persistence', () => {
  it('round-trips a valid session', () => {
    const provider = new InMemoryQuestionProvider(examQuestions())
    const session = createExam(provider)

    expect(restoreQuizSession(serializeQuizSession(session), provider)).toEqual({
      ok: true,
      value: session,
    })
  })

  it('rejects malformed data and sessions whose questions disappeared', () => {
    const provider = new InMemoryQuestionProvider(examQuestions())
    const session = createExam(provider)

    expect(restoreQuizSession('{broken', provider)).toMatchObject({
      ok: false,
      error: { code: 'invalid-serialized-session' },
    })
    expect(
      restoreQuizSession(
        JSON.stringify({
          ...session,
          responses: [
            {
              questionId: 'q-1',
              selectedOptionId: 'not-an-option',
              isCorrect: true,
              answeredAt: now,
            },
          ],
        }),
        provider,
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'invalid-serialized-session' },
    })
    expect(
      restoreQuizSession(
        serializeQuizSession(session),
        new InMemoryQuestionProvider([]),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'missing-restored-question' },
    })
  })
})
