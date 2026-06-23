import { Alert, Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from '@mui/material'
import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/authContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { user, loading, authError, signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    setSending(true)
    const ok = await signInWithMagicLink(email.trim())
    setSending(false)
    setSent(ok)
  }

  return (
    <Box component="main" sx={{ minHeight: '100dvh', bgcolor: '#10223f', py: { xs: 5, md: 9 } }}>
      <Container maxWidth="sm">
        <Button color="inherit" onClick={() => navigate('/')} sx={{ color: 'white', mb: 3 }}>
          Înapoi acasă
        </Button>
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: '.14em' }}>
              Backup și sincronizare
            </Typography>
            <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: 38, md: 52 } }}>
              Conectare prin email
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
              Îți trimitem un link securizat. Nu ai nevoie de parolă, iar aplicația rămâne complet utilizabilă fără cont.
            </Typography>

            {authError && <Alert severity="error" sx={{ mt: 3 }}>{authError}</Alert>}
            {sent ? (
              <Alert severity="success" sx={{ mt: 3 }}>
                Verifică emailul și deschide linkul de conectare pe acest dispozitiv.
              </Alert>
            ) : (
              <Stack component="form" onSubmit={submit} spacing={2} sx={{ mt: 4 }}>
                <TextField
                  label="Adresa de email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Button type="submit" variant="contained" size="large" disabled={sending || loading}>
                  {sending ? 'Se trimite…' : 'Trimite linkul de conectare'}
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
