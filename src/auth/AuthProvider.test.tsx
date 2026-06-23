import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuestionDataContext } from '../app/questionDataContext'
import { useQuizStore } from '../store/quizStore'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './authContext'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithOtp: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabaseConfigError: undefined,
  supabase: {
    auth: {
      getSession: mocks.getSession,
      signInWithOtp: mocks.signInWithOtp,
      signOut: mocks.signOut,
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: mocks.unsubscribe } },
      })),
    },
  },
}))

function Harness() {
  const { user, signInWithMagicLink, signOut } = useAuth()
  return (
    <>
      <div>{user?.email ?? 'guest'}</div>
      <button onClick={() => void signInWithMagicLink('test@example.com')}>Login</button>
      <button onClick={() => void signOut()}>Logout</button>
    </>
  )
}

function renderProvider() {
  return render(
    <QuestionDataContext.Provider value={{
      modules: [],
      loading: false,
      retry: () => undefined,
    }}>
      <AuthProvider><Harness /></AuthProvider>
    </QuestionDataContext.Provider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
  mocks.signInWithOtp.mockResolvedValue({ error: null })
  mocks.signOut.mockResolvedValue({ error: null })
  useQuizStore.setState({
    progressByQuestionId: {},
    examHistory: [],
    activeSession: undefined,
    completedSession: undefined,
  })
})

afterEach(cleanup)

describe('AuthProvider', () => {
  it('requests a magic link with the app callback URL', async () => {
    const user = userEvent.setup()
    renderProvider()
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
  })

  it('clears quiz data only after successful remote sign-out', async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1', email: 'test@example.com' },
        },
      },
      error: null,
    })
    useQuizStore.setState({
      progressByQuestionId: {
        'q-1': { questionId: 'q-1', seenCount: 1, correctCount: 1, wrongCount: 0 },
      },
    })
    const user = userEvent.setup()
    renderProvider()
    expect(await screen.findByText('test@example.com')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Logout' }))

    expect(mocks.signOut).toHaveBeenCalledOnce()
    expect(useQuizStore.getState().progressByQuestionId).toEqual({})
    expect(useQuizStore.getState().examHistory).toEqual([])
  })

  it('preserves local quiz data when remote sign-out fails', async () => {
    mocks.signOut.mockResolvedValue({ error: new Error('offline') })
    useQuizStore.setState({
      progressByQuestionId: {
        'q-1': { questionId: 'q-1', seenCount: 1, correctCount: 1, wrongCount: 0 },
      },
    })
    const user = userEvent.setup()
    renderProvider()
    await user.click(screen.getByRole('button', { name: 'Logout' }))

    expect(useQuizStore.getState().progressByQuestionId).toHaveProperty('q-1')
  })
})
