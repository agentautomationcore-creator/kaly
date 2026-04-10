import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../../src/lib/theme';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { DailyDiary } from '../../../src/features/diary/components/DailyDiary';
import { Toast } from '../../../src/components/Toast';

export default function DiaryScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saved } = useLocalSearchParams<{ saved?: string }>();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (saved === '1') setShowToast(true);
  }, [saved]);

  return (
    <ErrorBoundary featureName="diary">
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
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
