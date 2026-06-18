import type { QuizQuestion } from './quizTypes'

export interface QuestionProvider {
  getAll(): readonly QuizQuestion[]
  getById(id: string): QuizQuestion | undefined
  getByModuleId(moduleId: string): readonly QuizQuestion[]
  hasModule(moduleId: string): boolean
}

export class InMemoryQuestionProvider implements QuestionProvider {
  readonly #questions: readonly QuizQuestion[]
  readonly #questionsById: ReadonlyMap<string, QuizQuestion>
  readonly #moduleIds: ReadonlySet<string>

  constructor(
    questions: readonly QuizQuestion[],
    moduleIds: readonly string[] = questions.map(({ moduleId }) => moduleId),
  ) {
    this.#questions = [...questions]
    this.#questionsById = new Map(
      questions.map((question) => [question.id, question]),
    )
    this.#moduleIds = new Set(moduleIds)
  }

  getAll(): readonly QuizQuestion[] {
    return this.#questions
  }

  getById(id: string): QuizQuestion | undefined {
    return this.#questionsById.get(id)
  }

  getByModuleId(moduleId: string): readonly QuizQuestion[] {
    return this.#questions.filter((question) => question.moduleId === moduleId)
  }

  hasModule(moduleId: string): boolean {
    return this.#moduleIds.has(moduleId)
  }
}
