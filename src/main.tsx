import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { BrowserRouter } from 'react-router'
import App from './App'
import { QuestionDataProvider } from './app/QuestionDataProvider'
import { theme } from './theme'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <QuestionDataProvider>
          <App />
        </QuestionDataProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
