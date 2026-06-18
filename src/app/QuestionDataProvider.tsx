import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import questionDataUrl from '../data/questions.json?url'
import { isQuestionDataset, type QuestionDataset } from '../data/questionDataset'
import { InMemoryQuestionProvider } from '../features/quiz'
import { useQuizStore } from '../store/quizStore'
import { QuestionDataContext, type QuestionDataContextValue } from './questionDataContext'

export function QuestionDataProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<QuestionDataset>()
  const [error, setError] = useState<string>()
  const [requestKey, setRequestKey] = useState(0)
  const initialize = useQuizStore((state) => state.initialize)

  const retry = useCallback(() => {
    setError(undefined)
    setRequestKey((key) => key + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetch(questionDataUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const value: unknown = await response.json()
        if (!isQuestionDataset(value)) {
          throw new Error('Structura setului de întrebări este invalidă.')
        }
        return value
      })
      .then(setDataset)
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
          setError('Setul de întrebări nu a putut fi încărcat.')
        }
      })

    return () => controller.abort()
  }, [requestKey])

  const provider = useMemo(
    () =>
      dataset
        ? new InMemoryQuestionProvider(
            dataset.questions,
            dataset.modules.map(({ id }) => id),
          )
        : undefined,
    [dataset],
  )

  useEffect(() => {
    if (provider) initialize(provider)
  }, [initialize, provider])

  const value = useMemo<QuestionDataContextValue>(
    () => ({
      dataset,
      modules: dataset?.modules ?? [],
      provider,
      loading: !dataset && !error,
      error,
      retry,
    }),
    [dataset, error, provider, retry],
  )

  return (
    <QuestionDataContext.Provider value={value}>
      {children}
    </QuestionDataContext.Provider>
  )
}
