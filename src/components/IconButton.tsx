import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../lib/theme';
import { MIN_TOUCH, RADIUS } from '../lib/constants';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  style?: ViewStyle;
  accessibilityLabel: string;
}

export function IconButton({
  icon,
  onPress,
  size = 22,
  color,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: MIN_TOUCH,
        height: MIN_TOUCH,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={size} color={color || colors.textSecondary} />
    </Pressable>
  );
}
