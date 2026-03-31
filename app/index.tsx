import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { useColors } from '../src/lib/theme';

export default function Index() {
  const router = useRouter();
  const colors = useColors();
  const { user, isLoading, isAnonymous } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/onboarding/welcome');
      return;
    }

    // Check if onboarding is done via profile
    // For now, go to tabs
    router.replace('/(tabs)/diary');
  }, [user, isLoading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
