import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../../src/lib/theme';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { ProfileScreen } from '../../../src/features/profile/components/ProfileScreen';

export default function ProfileTab() {
  const colors = useColors();

  return (
    <ErrorBoundary featureName="profile">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ProfileScreen />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
