import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../../src/lib/theme';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { FastingScreen } from '../../../src/features/fasting/components/FastingScreen';

export default function FastingTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ErrorBoundary featureName="fasting">
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <FastingScreen />
      </View>
    </ErrorBoundary>
  );
}
