import * as Sentry from '@sentry/react';

const isSentryEnabled = !!import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD;

export const logError = (message: string, error?: any, context?: Record<string, any>) => {
  const errorData = {
    error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    context,
    timestamp: new Date().toISOString(),
  };

  console.error(`[LOG ERROR] ${message}`, errorData);

  if (isSentryEnabled) {
    const errorToCapture = error instanceof Error ? error : new Error(message);
    Sentry.captureException(errorToCapture, {
      extra: {
        logMessage: message,
        ...(context || {}),
        originalError: !(error instanceof Error) ? error : undefined,
      },
      level: 'error',
    });
  }
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  console.log(`[LOG INFO] ${message}`, {
    context,
    timestamp: new Date().toISOString(),
  });
};
