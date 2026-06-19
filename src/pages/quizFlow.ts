import type { FeedbackPolicy } from '../features/quiz'

export type QuizPrimaryAction = 'submit' | 'submit-and-advance' | 'advance'

export function getQuizPrimaryAction(
  hasResponse: boolean,
  feedbackPolicy: FeedbackPolicy,
): QuizPrimaryAction {
  if (hasResponse) return 'advance'
  return feedbackPolicy === 'after-answer' ? 'submit' : 'submit-and-advance'
}

export function getQuizPrimaryLabel(
  hasResponse: boolean,
  feedbackPolicy: FeedbackPolicy,
  isLast: boolean,
): string {
  if (!hasResponse && feedbackPolicy === 'after-answer') {
    return 'Confirmă răspunsul'
  }

  return isLast ? 'Vezi rezultatele' : 'Întrebarea următoare'
}
