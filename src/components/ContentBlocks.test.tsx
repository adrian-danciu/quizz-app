import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContentBlocks } from './ContentBlocks'

describe('ContentBlocks', () => {
  it('renders mixed text, code, and image content', () => {
    render(
      <ContentBlocks
        blocks={[
          { type: 'text', value: 'Alege rezultatul' },
          { type: 'code', value: 'printf("%d", x);', language: 'c' },
          { type: 'image', src: '/diagram.png', alt: 'Diagramă arbore' },
        ]}
      />,
    )

    expect(screen.getByText('Alege rezultatul')).toBeInTheDocument()
    expect(screen.getByText('printf("%d", x);')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Diagramă arbore' })).toHaveAttribute('src', '/diagram.png')
  })
})
