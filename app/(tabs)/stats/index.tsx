import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../../src/lib/theme';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { StatsScreen } from '../../../src/features/stats/components/StatsScreen';

export default function StatsTab() {
  const colors = useColors();

  return (
    <ErrorBoundary featureName="stats">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <StatsScreen />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
