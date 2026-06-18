import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AnswerOption } from './AnswerOption'

const option = { id: 'a', content: [{ type: 'text' as const, value: 'Varianta A' }] }

describe('AnswerOption', () => {
  it('accepts selection before confirmation and ignores clicks when locked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { rerender } = render(<AnswerOption option={option} state="neutral" onClick={onClick} />)

    await user.click(screen.getByRole('button', { name: /varianta a/i }))
    expect(onClick).toHaveBeenCalledOnce()

    rerender(<AnswerOption option={option} state="selected" disabled onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: /varianta a/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
