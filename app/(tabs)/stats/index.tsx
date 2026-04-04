import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../src/lib/theme';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { GradientHeader } from '../../../src/components/GradientHeader';
import { StatsScreen } from '../../../src/features/stats/components/StatsScreen';

export default function StatsTab() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <ErrorBoundary featureName="stats">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GradientHeader title={t('stats.title')} />
        <StatsScreen />
      </View>
    </ErrorBoundary>
  );
}
