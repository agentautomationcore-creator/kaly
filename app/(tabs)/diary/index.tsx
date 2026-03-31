import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../../src/lib/theme';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { DailyDiary } from '../../../src/features/diary/components/DailyDiary';

export default function DiaryScreen() {
  const colors = useColors();

  return (
    <ErrorBoundary featureName="diary">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <DailyDiary />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
