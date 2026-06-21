import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment =
    process.env.APP_ENV || process.env.NODE_ENV || 'development';

  if (!dsn) {
    console.warn('[Sentry] SENTRY_DSN not found. Sentry disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
  });

  console.log(`[Sentry] Initialized for environment: ${environment}`);
}

export { Sentry };
