import React, { useCallback } from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../lib/theme';
import { MIN_TOUCH, RADIUS, SHADOW } from '../lib/constants';
import { typography } from '../lib/typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  gradient?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = 'primary',
  gradient = false,
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  // Map legacy 'outline' → 'ghost'
  const v = variant === 'outline' ? 'ghost' : variant;

  const bgColor =
    v === 'primary' ? colors.primary :
    v === 'secondary' ? colors.primarySubtle :
    v === 'danger' ? colors.errorSubtle :
    'transparent';

  const txtColor =
    v === 'primary' ? colors.textInverse :
    v === 'secondary' ? colors.primary :
    v === 'danger' ? colors.error :
    colors.primary; // ghost

  const height = v === 'ghost' ? 44 : 52;

  const shadowStyle = v === 'primary' && !disabled ? SHADOW.glow : {};

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);

  const inner = loading ? (
    <ActivityIndicator color={txtColor} size="small" />
  ) : (
    <Text style={{ ...typography.bodyMedium, color: txtColor, ...textStyle }}>
      {title}
    </Text>
  );

  const containerStyle: ViewStyle = {
    minHeight: height,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    opacity: disabled ? 0.6 : 1,
    ...shadowStyle,
    ...style,
  };

  if (gradient && v === 'primary' && !disabled) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={animatedStyle}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={containerStyle}
        >
          {inner}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={{
        ...containerStyle,
        backgroundColor: disabled ? colors.surfaceElevated : bgColor,
        borderWidth: disabled ? 1 : 0,
        borderColor: disabled ? colors.border : 'transparent',
        ...animatedStyle,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      {inner}
    </AnimatedPressable>
  );
}
