import type { QuestionProgress } from './quizTypes'

export type ProgressAnswer = {
  questionId: string
  isCorrect: boolean
  answeredAt: string
}

export function updateQuestionProgress(
  previous: QuestionProgress | undefined,
  answer: ProgressAnswer,
): QuestionProgress {
  if (previous && previous.questionId !== answer.questionId) {
    throw new Error('Progress and answer question IDs must match.')
  }

  return {
    questionId: answer.questionId,
    seenCount: (previous?.seenCount ?? 0) + 1,
    correctCount: (previous?.correctCount ?? 0) + (answer.isCorrect ? 1 : 0),
    wrongCount: (previous?.wrongCount ?? 0) + (answer.isCorrect ? 0 : 1),
    lastSeenAt: answer.answeredAt,
    lastAnsweredCorrectly: answer.isCorrect,
  }
}
