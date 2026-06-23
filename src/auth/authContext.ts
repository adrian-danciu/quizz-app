import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export type AuthContextValue = {
  user?: User
  loading: boolean
  authError?: string
  syncStatus: SyncStatus
  signInWithMagicLink: (email: string) => Promise<boolean>
  signOut: () => Promise<boolean>
  retrySync: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
