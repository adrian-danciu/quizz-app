import type { QuizResult, QuizSession } from './quizTypes'

export function calculateQuizResult(session: QuizSession): QuizResult {
  const correctAnswers = session.responses.filter(
    ({ isCorrect }) => isCorrect,
  ).length
  const wrongQuestionIds = session.responses
    .filter(({ isCorrect }) => !isCorrect)
    .map(({ questionId }) => questionId)
  const answeredQuestions = session.responses.length
  const quarterPoints = 4 + correctAnswers

  return {
    totalQuestions: session.questionIds.length,
    answeredQuestions,
    correctAnswers,
    wrongAnswers: answeredQuestions - correctAnswers,
    percentage:
      answeredQuestions === 0 ? 0 : (correctAnswers / answeredQuestions) * 100,
    quarterPoints,
    score: quarterPoints / 4,
    wrongQuestionIds,
  }
}
