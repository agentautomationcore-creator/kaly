import React from 'react';
import { Pressable, Text } from 'react-native';
import { useColors } from '../lib/theme';
import { RADIUS } from '../lib/constants';
import { typography } from '../lib/typography';

interface ChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  variant?: 'default' | 'allergen';
}

export function Chip({ label, selected, onToggle, variant = 'default' }: ChipProps) {
  const colors = useColors();

  const isAllergen = variant === 'allergen' && selected;

  const bgColor = isAllergen
    ? colors.error
    : selected
      ? colors.primary
      : colors.surface;

  const textColor = selected ? colors.textInverse : colors.textSecondary;

  const borderColor = selected ? 'transparent' : colors.border;

  return (
    <Pressable
      onPress={onToggle}
      style={{
        height: 44,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: RADIUS.full,
        backgroundColor: bgColor,
        borderWidth: selected ? 0 : 1,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={{ ...typography.smallMedium, color: textColor }}>
        {label}
      </Text>
    </Pressable>
  );
}
