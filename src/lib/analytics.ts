import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

const storage = createMMKV({ id: 'kaly-settings' });

type EventName =
  | 'app_opened'
  | 'scan_food'
  | 'scan_result'
  | 'water_logged'
  | 'meal_logged'
  | 'meal_repeated'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'onboarding_completed'
  | 'goal_set'
  | 'paywall_shown'
  | 'ai_consent_given'
  | 'health_consent_given'
  | 'registration_completed'
  | 'account_deleted'
  | 'data_exported'
  | 'feedback_submitted'
  | 'report_exported'
  | 'suggest_meal_tapped'
  | 'suggestion_added'
  | 'analyze_text'
  | 'text_result'
  | 'voice_input_start';

// PostHog client — dynamic import, structural typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let posthogClient: any = null;

export async function initAnalytics(): Promise<void> {
  // Don't initialize until user has given analytics consent (GDPR)
  const consent = storage.getBoolean('analyticsConsentGiven');
  if (!consent) {
    if (__DEV__) console.log('PostHog: waiting for user consent, skipping initialization');
    return;
  }

  const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

  if (!posthogKey || posthogKey.includes('placeholder')) {
    if (__DEV__) console.log('PostHog: no key configured, skipping initialization');
    return;
  }

  try {
    if (Platform.OS !== 'web') {
      // GDPR: Request ATT permission on iOS before initializing tracking
      if (Platform.OS === 'ios') {
        const { status } = await requestTrackingPermissionsAsync();
        if (status !== 'granted') {
          if (__DEV__) console.log('PostHog: ATT permission denied, skipping initialization');
          return;
        }
      }

      const { PostHog } = await import('posthog-react-native');
      posthogClient = new PostHog(posthogKey, {
        host: 'https://eu.posthog.com',
      });
    }
  } catch (e) {
    if (__DEV__) console.error('[Analytics] init error:', e);
  }
}

/**
 * Call after user grants analytics consent.
 * Stores consent flag and initializes PostHog.
 */
export async function grantAnalyticsConsent(): Promise<void> {
  storage.set('analyticsConsentGiven', true);
  await initAnalytics();
}

/**
 * Call when user revokes analytics consent.
 */
export function revokeAnalyticsConsent(): void {
  storage.set('analyticsConsentGiven', false);
  posthogClient?.reset();
  posthogClient = null;
}

/**
 * Track an event. NEVER send health data (calories, weight, macros) as properties.
 * Only action names and non-sensitive metadata.
 */
export function track(event: EventName, properties?: Record<string, unknown>): void {
  try {
    posthogClient?.capture(event, properties);
  } catch (e) {
    if (__DEV__) console.error('[Analytics] track error:', e);
  }
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  try {
    posthogClient?.identify(userId, traits);
  } catch (e) {
    if (__DEV__) console.error('[Analytics] identify error:', e);
  }
}

export function resetAnalytics(): void {
  try {
    posthogClient?.reset();
  } catch (e) {
    if (__DEV__) console.error('[Analytics] reset error:', e);
  }
}
