import React, { useEffect } from 'react';
import { ActivityIndicator, AppState, I18nManager, Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases from 'react-native-purchases';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { queryClient } from '../src/lib/queryClient';
import { useColors, useThemeMode } from '../src/lib/theme';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { useAuthStore } from '../src/stores/authStore';
import { loadSavedLanguage } from '../src/i18n';
import { initAnalytics, track } from '../src/lib/analytics';
import { initSentryIfConsented } from '../src/lib/sentry';
import '../src/i18n';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });
  const colors = useColors();
  const themeMode = useThemeMode();
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    const init = async () => {
      initAuth();
      loadSavedLanguage();

      if (Platform.OS === 'ios') {
        await requestTrackingPermissionsAsync();
      }

      // Init analytics & error tracking ONLY after consent (GDPR)
      initSentryIfConsented();
      initAnalytics().catch(() => {});
      track('app_opened');

      const rcKey = Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
    if (rcKey) {
      Purchases.configure({ apiKey: rcKey });
    }
    };
    init();
  }, []);

  // SUB-2: Listen for subscription changes (cancel, renew, expire)
  useEffect(() => {
    const syncPlan = (customerInfo: { entitlements: { active: Record<string, unknown> } }) => {
      const isPro = !!customerInfo.entitlements.active['pro'];
      const newPlan = isPro ? 'pro' : 'free';
      const profile = useAuthStore.getState().profile;
      if (profile && profile.plan !== newPlan) {
        useAuthStore.getState().setProfile({ ...profile, plan: newPlan });
      }
    };

    Purchases.addCustomerInfoUpdateListener(syncPlan);

    // Also check on foreground resume
    const appStateSubscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          await syncPlan(customerInfo);
        } catch (e) {
          // SDK not ready yet — don't report, expected during cold start
        }
      }
    });

    return () => {
      Purchases.removeCustomerInfoUpdateListener(syncPlan);
      appStateSubscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary featureName="root">
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
          <OfflineBanner />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: I18nManager.isRTL ? 'slide_from_left' : 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: true }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
            <Stack.Screen name="barcode" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="food-search" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="manual-entry" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="meal-suggestions" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="text-entry" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="debug" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
