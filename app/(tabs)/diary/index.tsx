import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../src/lib/theme';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { GradientHeader } from '../../../src/components/GradientHeader';
import { DailyDiary } from '../../../src/features/diary/components/DailyDiary';

export default function DiaryScreen() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <ErrorBoundary featureName="diary">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GradientHeader title={t('diary.title')} />
        <DailyDiary />
      </View>
    </ErrorBoundary>
  );
}
