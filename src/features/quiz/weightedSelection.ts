import { calculateQuestionWeight } from './questionWeight'
import type {
  ProgressByQuestionId,
  QuizQuestion,
} from './quizTypes'

export type WeightedSelectionOptions = {
  questions: readonly QuizQuestion[]
  progressByQuestionId?: ProgressByQuestionId
  count: number
  now: Date | string | number
  random?: () => number
}

export function selectWeightedQuestions({
  questions,
  progressByQuestionId = {},
  count,
  now,
  random = Math.random,
}: WeightedSelectionOptions): QuizQuestion[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('Selection count must be a non-negative integer.')
  }

  const ids = new Set<string>()
  for (const question of questions) {
    if (ids.has(question.id)) {
      throw new Error(`Duplicate question ID: ${question.id}`)
    }
    ids.add(question.id)
  }

  const remaining = [...questions]
  const selected: QuizQuestion[] = []
  const selectionCount = Math.min(count, remaining.length)

  while (selected.length < selectionCount) {
    const weights = remaining.map((question) =>
      calculateQuestionWeight(progressByQuestionId[question.id], now),
    )
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    const randomValue = random()

    if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
      throw new Error('The random function must return a value in [0, 1).')
    }

    const target = randomValue * totalWeight
    let cumulativeWeight = 0
    let selectedIndex = remaining.length - 1

    for (let index = 0; index < remaining.length; index += 1) {
      cumulativeWeight += weights[index]
      if (target < cumulativeWeight) {
        selectedIndex = index
        break
      }
    }

    selected.push(remaining[selectedIndex])
    remaining.splice(selectedIndex, 1)
  }

  return selected
}
