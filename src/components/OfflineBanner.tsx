import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import { useColors } from '../lib/theme';
import { FONT_SIZE } from '../lib/constants';

export function OfflineBanner() {
  const { t } = useTranslation();
  const colors = useColors();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View
      style={{
        backgroundColor: colors.warningLight,
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: FONT_SIZE.sm, color: colors.warning, fontWeight: '500' }}>
        {t('errors.offline_banner')}
      </Text>
    </View>
  );
}
