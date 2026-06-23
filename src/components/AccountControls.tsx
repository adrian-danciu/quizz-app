import { Button, Chip, Stack } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'
import { ConfirmDialog } from './ConfirmDialog'

const syncLabels = {
  idle: 'Local',
  syncing: 'Se sincronizează',
  synced: 'Sincronizat',
  error: 'Sincronizare oprită',
} as const

export function AccountControls() {
  const navigate = useNavigate()
  const { user, syncStatus, signOut, retrySync } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!user) {
    return (
      <Button color="inherit" onClick={() => navigate('/login')}>
        Conectează-te pentru sincronizare
      </Button>
    )
  }

  return (
    <>
      <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip
          size="small"
          label={syncLabels[syncStatus]}
          color={syncStatus === 'error' ? 'error' : 'success'}
          variant={syncStatus === 'syncing' ? 'outlined' : 'filled'}
          onClick={syncStatus === 'error' ? retrySync : undefined}
        />
        <Button color="inherit" onClick={() => setConfirmOpen(true)}>
          {user.email ?? 'Contul meu'} · Deconectare
        </Button>
      </Stack>
      <ConfirmDialog
        open={confirmOpen}
        title="Te deconectezi?"
        description="Istoricul, progresul și orice sesiune locală vor fi șterse de pe acest dispozitiv. Datele sincronizate rămân online și reapar după reconectare."
        confirmLabel="Deconectează-mă"
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          const ok = await signOut()
          if (ok) {
            setConfirmOpen(false)
            navigate('/', { replace: true })
          }
        }}
      />
    </>
  )
}
