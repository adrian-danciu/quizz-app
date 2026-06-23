import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { BrowserRouter } from 'react-router'
import App from './App'
import { QuestionDataProvider } from './app/QuestionDataProvider'
import { LazyAuthProvider } from './auth/LazyAuthProvider'
import { theme } from './theme'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <QuestionDataProvider>
          <Suspense fallback={null}>
            <LazyAuthProvider>
              <App />
            </LazyAuthProvider>
          </Suspense>
        </QuestionDataProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
