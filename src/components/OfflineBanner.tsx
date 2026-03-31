import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useColors } from '../lib/theme';

export function OfflineBanner() {
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
      <Text style={{ fontSize: 13, color: colors.warning, fontWeight: '500' }}>
        Offline — data will sync when connected
      </Text>
    </View>
  );
}
