import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases from 'react-native-purchases';
import { queryClient } from '../src/lib/queryClient';
import { useColors, useThemeMode } from '../src/lib/theme';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/lib/supabase';
import { loadSavedLanguage } from '../src/i18n';
import '../src/i18n';

export default function RootLayout() {
  const colors = useColors();
  const themeMode = useThemeMode();
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    initAuth();
    loadSavedLanguage();

    const rcKey = Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
    if (rcKey) {
      Purchases.configure({ apiKey: rcKey });
    }
  }, []);

  // SUB-2: Listen for subscription changes (cancel, renew, expire)
  useEffect(() => {
    const syncPlan = async (customerInfo: { entitlements: { active: Record<string, unknown> } }) => {
      const isPro = !!customerInfo.entitlements.active['pro'];
      const newPlan = isPro ? 'pro' : 'free';
      const user = useAuthStore.getState().user;
      const profile = useAuthStore.getState().profile;
      if (user && profile && profile.plan !== newPlan) {
        await supabase
          .from('nutrition_profiles')
          .update({ plan: newPlan })
          .eq('user_id', user.id);
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
        } catch {
          // SDK not ready yet
        }
      }
    });

    return () => {
      Purchases.removeCustomerInfoUpdateListener(syncPlan);
      appStateSubscription.remove();
    };
  }, []);

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
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
