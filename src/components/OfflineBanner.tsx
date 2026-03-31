import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '../lib/theme';

// Simple offline detection without @react-native-community/netinfo
// Uses navigator.onLine on web, always online on native (add netinfo later if needed)

export function OfflineBanner() {
  const colors = useColors();
  const [isOffline, setIsOffline] = React.useState(false);

  // TODO: Add @react-native-community/netinfo for proper offline detection
  // For now, this is a placeholder component ready to be connected

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
