import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 2px 4px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.06)',
    '0px 3px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)',
    '0px 4px 8px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)',
    '0px 5px 10px rgba(0, 0, 0, 0.1), 0px 3px 6px rgba(0, 0, 0, 0.08)',
    '0px 6px 12px rgba(0, 0, 0, 0.1), 0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.1), 0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 10px 20px rgba(0, 0, 0, 0.1), 0px 6px 12px rgba(0, 0, 0, 0.08)',
    '0px 12px 24px rgba(0, 0, 0, 0.1), 0px 8px 16px rgba(0, 0, 0, 0.08)',
    '0px 14px 28px rgba(0, 0, 0, 0.12), 0px 10px 20px rgba(0, 0, 0, 0.1)',
    '0px 16px 32px rgba(0, 0, 0, 0.12), 0px 12px 24px rgba(0, 0, 0, 0.1)',
    '0px 18px 36px rgba(0, 0, 0, 0.12), 0px 14px 28px rgba(0, 0, 0, 0.1)',
    '0px 20px 40px rgba(0, 0, 0, 0.12), 0px 16px 32px rgba(0, 0, 0, 0.1)',
    '0px 22px 44px rgba(0, 0, 0, 0.12), 0px 18px 36px rgba(0, 0, 0, 0.1)',
    '0px 24px 48px rgba(0, 0, 0, 0.12), 0px 20px 40px rgba(0, 0, 0, 0.1)',
    '0px 26px 52px rgba(0, 0, 0, 0.12), 0px 22px 44px rgba(0, 0, 0, 0.1)',
    '0px 28px 56px rgba(0, 0, 0, 0.12), 0px 24px 48px rgba(0, 0, 0, 0.1)',
    '0px 30px 60px rgba(0, 0, 0, 0.12), 0px 26px 52px rgba(0, 0, 0, 0.1)',
    '0px 32px 64px rgba(0, 0, 0, 0.12), 0px 28px 56px rgba(0, 0, 0, 0.1)',
    '0px 34px 68px rgba(0, 0, 0, 0.12), 0px 30px 60px rgba(0, 0, 0, 0.1)',
    '0px 36px 72px rgba(0, 0, 0, 0.12), 0px 32px 64px rgba(0, 0, 0, 0.1)',
    '0px 38px 76px rgba(0, 0, 0, 0.12), 0px 34px 68px rgba(0, 0, 0, 0.1)',
    '0px 40px 80px rgba(0, 0, 0, 0.12), 0px 36px 72px rgba(0, 0, 0, 0.1)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
          },
        },
        containedSuccess: {
          background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1b5e20 0%, #0d3e0f 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08), 0px 1px 4px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12), 0px 2px 6px rgba(0, 0, 0, 0.08)',
            borderColor: 'rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(0, 0, 0, 0.12)',
        },
        outlined: {
          border: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: '#ffffff',
        },
        colorSuccess: {
          background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
          color: '#ffffff',
        },
        colorWarning: {
          background: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)',
          color: '#ffffff',
        },
        colorError: {
          background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
          color: '#ffffff',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 8,
        },
        bar: {
          borderRadius: 4,
          background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
        },
      },
    },
  },
});
