import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../src/lib/theme';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';
import { GradientHeader } from '../../../src/components/GradientHeader';
import { ProfileScreen } from '../../../src/features/profile/components/ProfileScreen';

export default function ProfileTab() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <ErrorBoundary featureName="profile">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GradientHeader title={t('profile.title')} />
        <ProfileScreen />
      </View>
    </ErrorBoundary>
  );
}
