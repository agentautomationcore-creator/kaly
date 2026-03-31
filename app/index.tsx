import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../src/stores/authStore';
import { useColors } from '../src/lib/theme';
import { supabase } from '../src/lib/supabase';

export default function Index() {
  const router = useRouter();
  const colors = useColors();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // EDGE-3: Distinguish 'never signed in' vs 'session expired'
      // Check if there was a previous session stored
      SecureStore.getItemAsync('sb-auth-token').then((token) => {
        if (token) {
          // Had a session before — try to refresh
          supabase.auth.refreshSession().then(({ data }) => {
            if (!data.session) {
              // Truly expired — go to login, not onboarding
              router.replace('/(auth)/login');
            }
            // If refresh succeeded, onAuthStateChange will handle routing
          });
        } else {
          // Never signed in — onboarding
          router.replace('/onboarding/welcome');
        }
      }).catch(() => {
        router.replace('/onboarding/welcome');
      });
      return;
    }

    router.replace('/(tabs)/diary');
  }, [user, isLoading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
