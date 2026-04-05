import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useColors } from '../lib/theme';
import { MIN_TOUCH, RADIUS, FONT_SIZE, SPACING } from '../lib/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const colors = useColors();

  const bgColor =
    variant === 'primary' ? colors.primary :
    variant === 'danger' ? colors.danger :
    variant === 'outline' ? 'transparent' :
    colors.surface;

  const textColor =
    variant === 'primary' || variant === 'danger' ? colors.card :
    variant === 'outline' ? colors.primary :
    colors.text;

  const borderColor = variant === 'outline' ? colors.primary : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        minHeight: MIN_TOUCH + 8,
        borderRadius: RADIUS.md,
        backgroundColor: disabled ? colors.border : bgColor,
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
        paddingVertical: 14,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          style={{
            fontSize: FONT_SIZE.md,
            fontWeight: '700',
            color: textColor,
            ...textStyle,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
