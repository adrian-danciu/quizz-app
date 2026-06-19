import { useLayoutEffect, useRef, useState } from 'react'

export type QuizDensity = 'comfortable' | 'compact' | 'dense'

const densityOrder: readonly QuizDensity[] = [
  'comfortable',
  'compact',
  'dense',
]

export function nextQuizDensity(density: QuizDensity): QuizDensity {
  const index = densityOrder.indexOf(density)
  return densityOrder[Math.min(index + 1, densityOrder.length - 1)]
}

export function useQuizViewportFit(contentKey: string) {
  const frameRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const frameSizeRef = useRef({ width: 0, height: 0 })
  const animationFrameRef = useRef<number | null>(null)
  const [density, setDensity] = useState<QuizDensity>('comfortable')

  useLayoutEffect(() => {
    const frame = frameRef.current
    const content = contentRef.current
    if (!frame || !content) return

    const measure = () => {
      animationFrameRef.current = null

      const width = frame.clientWidth
      const height = frame.clientHeight
      const previousSize = frameSizeRef.current
      const frameGrew =
        width > previousSize.width + 2 || height > previousSize.height + 2

      frameSizeRef.current = { width, height }

      if (frameGrew && density !== 'comfortable') {
        setDensity('comfortable')
        return
      }

      const overflows =
        content.scrollHeight > frame.clientHeight + 1 ||
        content.scrollWidth > frame.clientWidth + 1

      if (overflows) {
        setDensity((current) => nextQuizDensity(current))
      }
    }

    const scheduleMeasure = () => {
      if (animationFrameRef.current !== null) return
      animationFrameRef.current = window.requestAnimationFrame(measure)
    }

    const resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(frame)
    resizeObserver.observe(content)
    scheduleMeasure()

    return () => {
      resizeObserver.disconnect()
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [contentKey, density])

  return { frameRef, contentRef, density }
}
