import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { useColors } from '../lib/theme';
import { RADIUS, SPACING } from '../lib/constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        ...(Platform.OS === 'ios'
          ? { shadowColor: colors.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }
          : { elevation: 2 }),
        ...style,
      }}
    >
      {children}
    </View>
  );
}
