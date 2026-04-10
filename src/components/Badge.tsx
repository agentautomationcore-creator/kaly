import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '../lib/theme';
import { RADIUS } from '../lib/constants';
import { typography } from '../lib/typography';

type BadgeVariant = 'ai' | 'barcode' | 'manual';

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
}

export function Badge({ variant, label }: BadgeProps) {
  const colors = useColors();

  const colorMap: Record<BadgeVariant, string> = {
    ai: colors.primary,
    barcode: colors.secondary,
    manual: colors.textSecondary,
  };

  const badgeColor = colorMap[variant];

  return (
    <View
      style={{
        backgroundColor: badgeColor + '1A', // ~10% opacity
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: RADIUS.xs,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ ...typography.caption, color: badgeColor }}>
        {label}
      </Text>
    </View>
  );
}
