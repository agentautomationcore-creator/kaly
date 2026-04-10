import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useColors } from '../lib/theme';
import { RADIUS, SPACING, SHADOW } from '../lib/constants';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  const colors = useColors();

  const isElevated = variant === 'elevated';

  return (
    <View
      style={{
        backgroundColor: isElevated ? colors.surfaceElevated : colors.surface,
        borderRadius: isElevated ? RADIUS.xl : RADIUS.lg,
        padding: SPACING[4],
        borderWidth: isElevated ? 0 : 1,
        borderColor: colors.border,
        ...(isElevated
          ? { ...SHADOW.lg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl }
          : SHADOW.sm),
        ...style,
      }}
    >
      {children}
    </View>
  );
}
