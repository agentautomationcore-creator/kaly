import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../../src/lib/theme';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { ScanScreen } from '../../../src/features/scan/components/ScanScreen';

export default function ScanTab() {
  const colors = useColors();

  return (
    <ErrorBoundary featureName="scan">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ScanScreen />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
