import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useColors } from '../../../src/lib/theme';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { GradientHeader } from '../../../src/components/GradientHeader';
import { DailyDiary } from '../../../src/features/diary/components/DailyDiary';
import { Toast } from '../../../src/components/Toast';

export default function DiaryScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { saved } = useLocalSearchParams<{ saved?: string }>();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (saved === '1') setShowToast(true);
  }, [saved]);

  return (
    <ErrorBoundary featureName="diary">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GradientHeader title={t('diary.title')} />
        <DailyDiary />
        <Toast
          message={t('diary.added_success')}
          visible={showToast}
          onHide={() => setShowToast(false)}
        />
      </View>
    </ErrorBoundary>
  );
}
