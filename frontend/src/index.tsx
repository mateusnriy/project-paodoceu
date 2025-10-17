import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import * as Sentry from "@sentry/react";

const _env = (import.meta as any).env;
const SENTRY_DSN = _env.VITE_SENTRY_DSN;

if (SENTRY_DSN && _env.PROD) { 
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    environment: _env.MODE, 
  });
  console.log("Sentry initialized for production.");
} else {
    console.log("Sentry DSN not found or not in production mode. Sentry not initialized.");
}


const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}
