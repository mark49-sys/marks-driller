import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Slide, { SlideProps } from '@mui/material/Slide';
import { useNotificationStore } from '../store/useNotificationStore.js';

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export const NotificationCenter: React.FC = () => {
  const { currentNotification, dismissNotification } = useNotificationStore();

  const isOpen = Boolean(currentNotification);

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    dismissNotification();
  };

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={currentNotification?.duration || 5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={SlideTransition}
      sx={{
        top: { xs: 'calc(env(safe-area-inset-top, 0px) + 12px)', sm: 24 },
        zIndex: 11000,
        maxWidth: 'calc(100vw - 24px)',
        width: { xs: 'calc(100vw - 24px)', sm: '480px' },
        left: { xs: '12px', sm: 'auto' },
        right: { xs: '12px', sm: 'auto' },
        transform: { xs: 'none !important', sm: 'translateX(-50%)' },
      }}
    >
      {currentNotification ? (
        <Alert
          onClose={handleClose}
          severity={currentNotification.severity}
          variant="filled"
          role="alert"
          aria-live={currentNotification.severity === 'error' ? 'assertive' : 'polite'}
          sx={{
            width: '100%',
            boxShadow: '0 8px 24px rgba(20, 24, 28, 0.22)',
            border: '1.5px solid rgba(20, 24, 28, 0.15)',
            borderRadius: '8px',
            fontFamily: "var(--font-sans)",
            fontSize: '14px',
            alignItems: 'center',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            '& .MuiAlert-icon': {
              fontSize: '22px',
              mr: 1.5,
              flexShrink: 0,
            },
            '& .MuiAlert-message': {
              fontWeight: 500,
              lineHeight: 1.45,
              minWidth: 0,
              flex: 1,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            },
            '& .MuiAlert-action': {
              pt: 0,
              mr: -0.5,
              '& .MuiIconButton-root': {
                minWidth: '40px',
                minHeight: '40px',
              },
            },
            ...(currentNotification.severity === 'success' && {
              backgroundColor: '#1b6e3b',
              color: '#ffffff',
            }),
            ...(currentNotification.severity === 'error' && {
              backgroundColor: '#991b1b',
              color: '#ffffff',
            }),
            ...(currentNotification.severity === 'warning' && {
              backgroundColor: '#b45309',
              color: '#ffffff',
            }),
            ...(currentNotification.severity === 'info' && {
              backgroundColor: '#1e3a8a',
              color: '#ffffff',
            }),
          }}
        >
          {currentNotification.title && (
            <AlertTitle
              sx={{
                fontWeight: 700,
                fontSize: '15px',
                fontFamily: "var(--font-sans)",
                mb: 0.25,
              }}
            >
              {currentNotification.title}
            </AlertTitle>
          )}
          {currentNotification.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
};

