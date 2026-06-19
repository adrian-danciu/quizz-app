import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContentBlocks } from './ContentBlocks'

describe('ContentBlocks', () => {
  it('renders mixed text, code, and image content', () => {
    const { container } = render(
      <ContentBlocks
        blocks={[
          { type: 'text', value: 'Alege rezultatul' },
          { type: 'code', value: 'printf("%d", x);', language: 'c' },
          { type: 'image', src: '/diagram.png', alt: 'Diagramă arbore' },
        ]}
      />,
    )

    expect(screen.getByText('Alege rezultatul')).toBeInTheDocument()
    expect(container.querySelector('pre')).toHaveTextContent('printf("%d", x);')
    expect(container.querySelector('pre')).toHaveAttribute('data-language', 'c')
    expect(screen.getByRole('img', { name: 'Diagramă arbore' })).toHaveAttribute('src', '/diagram.png')
  })

  it('keeps its content stack width-constrained', () => {
    const { container } = render(
      <ContentBlocks blocks={[{ type: 'text', value: 'Răspuns text' }]} />,
    )

    expect(container.firstChild).toHaveStyle({
      minWidth: '0',
      maxWidth: '100%',
    })
  })
})
