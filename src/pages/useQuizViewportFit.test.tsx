import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextQuizDensity, useQuizViewportFit } from './useQuizViewportFit'

function Harness() {
  const { frameRef, contentRef, density } = useQuizViewportFit('question-1')

  return (
    <div ref={frameRef} data-testid="frame">
      <div ref={contentRef} data-testid="content">
        {density}
      </div>
    </div>
  )
}

describe('useQuizViewportFit', () => {
  const animationFrames: FrameRequestCallback[] = []

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          void callback
        }
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    )
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      animationFrames.push(callback)
      return animationFrames.length
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.dataset.testid === 'frame' ? 320 : 420
      },
    )
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.dataset.testid === 'frame' ? 500 : 700
      },
    )
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.dataset.testid === 'content' ? 420 : 320
      },
    )
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.dataset.testid === 'content' ? 700 : 500
      },
    )
  })

  afterEach(() => {
    animationFrames.length = 0
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('advances overflowing content through the bounded density tiers', () => {
    render(<Harness />)

    act(() => animationFrames.shift()?.(0))
    expect(screen.getByTestId('content')).toHaveTextContent('compact')

    act(() => animationFrames.shift()?.(0))
    expect(screen.getByTestId('content')).toHaveTextContent('dense')

    act(() => animationFrames.shift()?.(0))
    expect(screen.getByTestId('content')).toHaveTextContent('dense')
    expect(animationFrames).toHaveLength(0)
  })

  it('never advances beyond dense', () => {
    expect(nextQuizDensity('comfortable')).toBe('compact')
    expect(nextQuizDensity('compact')).toBe('dense')
    expect(nextQuizDensity('dense')).toBe('dense')
  })
})
