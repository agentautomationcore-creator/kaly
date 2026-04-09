import { Stack } from 'expo-router';
import { I18nManager } from 'react-native';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: I18nManager.isRTL ? 'slide_from_left' : 'slide_from_right',
      }}
    />
  );
}
