import { createTheme } from '@mui/material/styles'

const MONO = '"JetBrains Mono", "SFMono-Regular", Consolas, monospace'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0a0f1e', paper: '#0f1629' },
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#22d3ee' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    info: { main: '#3b82f6' },
    divider: 'rgba(255,255,255,0.06)',
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h3: { fontWeight: 700, fontFamily: MONO, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, fontFamily: MONO, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '::-webkit-scrollbar': { width: 8, height: 8 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 8,
        },
        '::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.18)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 22, 41, 0.1)',
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#141c35',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 12,
        },
      },
    },
  },
})

export const colors = {
  bg: '#0a0f1e',
  paper: '#0f1629',
  elevated: '#141c35',
  border: 'rgba(255,255,255,0.06)',
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
}

export const SERVICE_COLORS: Record<string, string> = {
  EC2: '#6366f1',
  RDS: '#22d3ee',
  S3: '#f59e0b',
  Lambda: '#10b981',
  CloudFront: '#ec4899',
  DynamoDB: '#f97316',
}
