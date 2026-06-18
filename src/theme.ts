import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1d4ed8',
      dark: '#163ba5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f97316',
      dark: '#d95d08',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#10223f',
      secondary: '#5c6b80',
    },
    divider: '#dce4ef',
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 700,
      letterSpacing: '-0.035em',
    },
    h2: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 22,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 16px 50px rgba(16, 34, 63, 0.08)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        bar: {
          borderRadius: 999,
          backgroundImage: 'linear-gradient(90deg, #2563eb, #f97316)',
        },
      },
    },
  },
})
