import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQuestionData } from '../app/questionDataContext'
import {
  fetchCloudQuizState,
  mergeQuizState,
  pruneExamHistory,
  upsertExamHistory,
  upsertQuestionProgress,
} from '../features/cloudSync'
import { supabase, supabaseConfigError } from '../lib/supabase'
import { useQuizStore } from '../store/quizStore'
import { AuthContext, type AuthContextValue, type SyncStatus } from './authContext'

const SYNC_ERROR = 'Datele locale sunt în siguranță, dar sincronizarea nu a reușit.'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { provider } = useQuestionData()
  const initialized = useQuizStore((state) => state.initialized)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [authError, setAuthError] = useState<string | undefined>(
    supabaseConfigError,
  )
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const suppressStoreSyncRef = useRef(false)
  const synchronizedUserRef = useRef<string | undefined>(undefined)
  const activeSyncUserRef = useRef<string | undefined>(undefined)

  const setSyncFailure = useCallback((reason: unknown) => {
    console.error('Supabase sync failed.', reason)
    setSyncStatus('error')
    useQuizStore.getState().setPersistenceWarning(SYNC_ERROR)
  }, [])

  const enqueue = useCallback(
    (userId: string, task: () => Promise<void>) => {
      setSyncStatus('syncing')
      queueRef.current = queueRef.current.then(task, task).then(
        () => {
          if (activeSyncUserRef.current !== userId) return
          setSyncStatus('synced')
          useQuizStore.getState().setPersistenceWarning(undefined)
        },
        (reason) => {
          if (activeSyncUserRef.current === userId) setSyncFailure(reason)
        },
      )
    },
    [setSyncFailure],
  )

  const syncEverything = useCallback(
    async (userId: string) => {
      if (!supabase || !provider) return
      setSyncStatus('syncing')

      try {
        const cloud = await fetchCloudQuizState(supabase, userId)
        const local = useQuizStore.getState()
        const merged = mergeQuizState(
          local.examHistory,
          local.progressByQuestionId,
          cloud.exams,
          cloud.progress,
          provider,
        )
        if (activeSyncUserRef.current !== userId) return

        synchronizedUserRef.current = userId
        suppressStoreSyncRef.current = true
        local.applyCloudState(
          merged.progressByQuestionId,
          merged.examHistory,
        )
        suppressStoreSyncRef.current = false

        await upsertQuestionProgress(
          supabase,
          userId,
          Object.values(merged.progressByQuestionId),
        )
        await upsertExamHistory(supabase, userId, merged.examHistory)
        await pruneExamHistory(
          supabase,
          userId,
          merged.examHistory.map(({ id }) => id),
        )

        if (activeSyncUserRef.current !== userId) return
        const latest = useQuizStore.getState()
        if (
          latest.progressByQuestionId !== merged.progressByQuestionId ||
          latest.examHistory !== merged.examHistory
        ) {
          await upsertQuestionProgress(
            supabase,
            userId,
            Object.values(latest.progressByQuestionId),
          )
          await upsertExamHistory(supabase, userId, latest.examHistory)
          await pruneExamHistory(
            supabase,
            userId,
            latest.examHistory.map(({ id }) => id),
          )
        }

        setSyncStatus('synced')
        useQuizStore.getState().setPersistenceWarning(undefined)
      } catch (reason) {
        suppressStoreSyncRef.current = false
        if (activeSyncUserRef.current === userId) setSyncFailure(reason)
      }
    },
    [provider, setSyncFailure],
  )

  useEffect(() => {
    if (!supabase) {
      return
    }

    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setAuthError('Sesiunea de autentificare nu a putut fi restaurată.')
      setSession(data.session)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setLoading(false)
      if (nextSession) setAuthError(undefined)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const userId = session?.user.id
    if (!userId || !provider || !initialized) return
    activeSyncUserRef.current = userId

    if (
      synchronizedUserRef.current &&
      synchronizedUserRef.current !== userId
    ) {
      useQuizStore.getState().resetLocalQuizData()
    }
    if (synchronizedUserRef.current !== userId) void syncEverything(userId)
  }, [initialized, provider, session?.user.id, syncEverything])

  useEffect(() => {
    const userId = session?.user.id
    if (!userId || !supabase) return
    const client = supabase

    return useQuizStore.subscribe((state, previous) => {
      if (
        suppressStoreSyncRef.current ||
        synchronizedUserRef.current !== userId
      ) {
        return
      }

      const changedProgress = Object.values(state.progressByQuestionId).filter(
        (entry) => previous.progressByQuestionId[entry.questionId] !== entry,
      )
      if (changedProgress.length > 0) {
        enqueue(userId, () =>
          upsertQuestionProgress(client, userId, changedProgress),
        )
      }

      if (state.examHistory !== previous.examHistory) {
        const history = state.examHistory
        enqueue(userId, async () => {
          await upsertExamHistory(client, userId, history)
          await pruneExamHistory(
            client,
            userId,
            history.map(({ id }) => id),
          )
        })
      }
    })
  }, [enqueue, session?.user.id])

  const signInWithMagicLink = useCallback(async (email: string) => {
    if (!supabase) {
      setAuthError(supabaseConfigError)
      return false
    }
    setAuthError(undefined)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setAuthError(
        error.message.toLowerCase().includes('rate')
          ? 'Ai cerut prea multe linkuri. Încearcă din nou puțin mai târziu.'
          : 'Linkul de conectare nu a putut fi trimis.',
      )
      return false
    }
    return true
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return false
    setAuthError(undefined)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthError('Deconectarea nu a reușit. Datele locale au fost păstrate.')
      return false
    }

    synchronizedUserRef.current = undefined
    activeSyncUserRef.current = undefined
    queueRef.current = Promise.resolve()
    useQuizStore.getState().resetLocalQuizData()
    setSession(null)
    setSyncStatus('idle')
    return true
  }, [])

  const retrySync = useCallback(() => {
    const userId = session?.user.id
    if (userId) void syncEverything(userId)
  }, [session?.user.id, syncEverything])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user,
      loading,
      authError,
      syncStatus,
      signInWithMagicLink,
      signOut,
      retrySync,
    }),
    [
      authError,
      loading,
      retrySync,
      session?.user,
      signInWithMagicLink,
      signOut,
      syncStatus,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
