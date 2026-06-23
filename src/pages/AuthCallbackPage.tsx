import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { user, loading, authError } = useAuth()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [navigate, user])

  return (
    <Stack component="main" sx={{ minHeight: '100dvh', p: 3, alignItems: 'center', justifyContent: 'center' }}>
      {loading ? (
        <>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Finalizăm conectarea…</Typography>
        </>
      ) : authError ? (
        <Box sx={{ width: '100%', maxWidth: 520 }}>
          <Alert severity="error">{authError}</Alert>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/login', { replace: true })}>
            Cere un link nou
          </Button>
        </Box>
      ) : (
        <Typography>Conectarea nu a putut fi confirmată.</Typography>
      )}
    </Stack>
  )
}
