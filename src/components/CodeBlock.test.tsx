import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CodeBlock } from './CodeBlock'

describe('CodeBlock', () => {
  it.each([
    ['c', 'int main() { return 0; }'],
    ['cpp', 'std::vector<int> values;'],
    ['python', 'def answer():\n    return 42'],
    ['java', 'public class Answer {}'],
    ['sql', 'SELECT id FROM users;'],
    ['bash', 'echo "$HOME"'],
  ])('highlights %s while preserving the exact code', (language, code) => {
    const { container } = render(<CodeBlock code={code} language={language} />)
    const pre = container.querySelector('pre')

    expect(pre).toHaveAttribute('data-language', language)
    expect(pre).toHaveTextContent(code, { normalizeWhitespace: false })
    expect(pre?.querySelector('.token')).toBeInTheDocument()
  })

  it('renders plain text safely when no grammar is available', () => {
    const code = 'line one\n  line two'
    const { container } = render(<CodeBlock code={code} language="unknown" />)
    const pre = container.querySelector('pre')

    expect(screen.getByText('unknown', { exact: false })).toBeInTheDocument()
    expect(pre).toHaveTextContent(code, { normalizeWhitespace: false })
    expect(pre?.querySelector('.token')).not.toBeInTheDocument()
  })

  it('wraps long lines instead of creating a code scrollbar', () => {
    const { container } = render(
      <CodeBlock code={'value = "a very long line"'} language="python" />,
    )
    const pre = container.querySelector('pre')

    expect(pre).toHaveStyle({
      maxWidth: '100%',
      overflow: 'hidden',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
    })
  })
})
