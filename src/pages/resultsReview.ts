import type { QuizResponse } from '../features/quiz'

export function orderResponsesForReview(responses: readonly QuizResponse[], questionIds: readonly string[]): QuizResponse[] {
  const order = new Map(questionIds.map((id, index) => [id, index]))
  return [...responses].sort((a, b) => {
    if (a.isCorrect !== b.isCorrect) return a.isCorrect ? 1 : -1
    return (order.get(a.questionId) ?? 0) - (order.get(b.questionId) ?? 0)
  })
}
