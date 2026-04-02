import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'kaly-settings' });
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

let sentryModule: typeof import('@sentry/react-native') | null = null;

/**
 * Initialize Sentry ONLY after analytics consent is given.
 * Must be called after consent check — never at module load time.
 */
export function initSentryIfConsented(): void {
  if (!SENTRY_DSN || SENTRY_DSN.includes('placeholder') || Platform.OS === 'web') return;

  try {
    const consent = storage.getBoolean('analyticsConsentGiven');
    if (!consent) return;

    const Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.2,
      enableAutoSessionTracking: true,
    });
    sentryModule = Sentry;
  } catch (e) {
    if (__DEV__) console.error('[Sentry] init error:', e);
  }
}

/**
 * Capture an exception to Sentry. Safe to call even if Sentry is not initialized.
 * NEVER pass health data (calories, weight, macros, food photos) as context.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (__DEV__) {
    console.error('[Sentry]', error, context);
  }

  try {
    if (sentryModule) {
      if (context) {
        sentryModule.withScope((scope) => {
          scope.setExtras(context);
          sentryModule!.captureException(error);
        });
      } else {
        sentryModule.captureException(error);
      }
    }
  } catch {
    // Sentry itself failed — silently ignore
  }
}

/**
 * Set user context for Sentry. Only set user ID, never health data.
 */
export function setSentryUser(userId: string | null): void {
  try {
    if (sentryModule) {
      sentryModule.setUser(userId ? { id: userId } : null);
    }
  } catch {
    // ignore
  }
}
