import React, { useState, useCallback } from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useColors } from '../lib/theme';
import { RADIUS, SHADOW } from '../lib/constants';
import { ANIM } from '../lib/animations';
import { typography } from '../lib/typography';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface SaveButtonProps {
  title: string;
  onSave: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function SaveButton({ title, onSave, loading = false, disabled = false, style }: SaveButtonProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [saved, setSaved] = useState(false);
  const textOpacity = useSharedValue(1);
  const checkOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const triggerAnimation = useCallback(() => {
    setSaved(true);
    // 1) Text fades out (150ms)
    textOpacity.value = withTiming(0, { duration: ANIM.fast.duration });
    // 2) Checkmark fades in (after 150ms)
    checkOpacity.value = withDelay(ANIM.fast.duration, withTiming(1, { duration: ANIM.normal.duration }));
    // 3) Scale pulse
    scale.value = withDelay(
      ANIM.fast.duration + 100,
      withSequence(withSpring(1.05, ANIM.spring), withSpring(1.0, ANIM.spring)),
    );
    // 4) Call onSave after animation
    setTimeout(onSave, 500);
  }, [onSave, textOpacity, checkOpacity, scale]);

  const handlePress = useCallback(() => {
    if (saved || loading || disabled) return;
    triggerAnimation();
  }, [saved, loading, disabled, triggerAnimation]);

  return (
    <Animated.View style={[containerStyle, style]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading || saved}
        style={{
          minHeight: 52,
          borderRadius: RADIUS.full,
          backgroundColor: disabled ? colors.border : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          opacity: disabled ? 0.5 : 1,
          ...SHADOW.glow,
        }}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={t('hints.save_food')}
      >
        {/* Text label */}
        <Animated.View style={[{ position: 'absolute' }, textStyle]}>
          <Text style={{ ...typography.bodyMedium, color: colors.textInverse }}>{title}</Text>
        </Animated.View>

        {/* Checkmark SVG */}
        <Animated.View style={[{ position: 'absolute' }, checkStyle]}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 13l4 4L19 7"
              stroke={colors.textInverse}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
