import { describe, expect, it } from 'vitest'

import { InMemoryQuestionProvider } from './questionProvider'
import type { QuizQuestion } from './quizTypes'

const questions: QuizQuestion[] = [
  {
    id: 'q-1',
    moduleId: 'module-a',
    content: [{ type: 'text', value: 'Question one' }],
    options: [
      { id: 'a', content: [{ type: 'text', value: 'A' }] },
      { id: 'b', content: [{ type: 'text', value: 'B' }] },
    ],
    correctOptionId: 'a',
  },
  {
    id: 'q-2',
    moduleId: 'module-b',
    content: [{ type: 'text', value: 'Question two' }],
    options: [
      { id: 'a', content: [{ type: 'text', value: 'A' }] },
      { id: 'b', content: [{ type: 'text', value: 'B' }] },
    ],
    correctOptionId: 'b',
  },
]

describe('InMemoryQuestionProvider', () => {
  it('returns questions in stable input order and filters by module', () => {
    const provider = new InMemoryQuestionProvider(questions)

    expect(provider.getAll().map(({ id }) => id)).toEqual(['q-1', 'q-2'])
    expect(provider.getById('q-2')?.id).toBe('q-2')
    expect(provider.getByModuleId('module-a').map(({ id }) => id)).toEqual([
      'q-1',
    ])
  })
})
