/// <reference types="vite/client" />

interface Window {
  ENV: {
    SENTRY_ENABLED: string;
  };
  SENTRY_ENABLED?: string; // deprecated, use window.ENV.SENTRY_ENABLED
}
