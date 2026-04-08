import React, { useEffect, useState } from 'react';
import { Text, View, AccessibilityInfo } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_SIZE, RADIUS, SPACING } from '../lib/constants';
import { useColors } from '../lib/theme';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, visible, onHide, duration = 2000 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  if (!visible) return null;

  const animDuration = reduceMotion ? 0 : 200;

  return (
    <Animated.View
      entering={FadeIn.duration(animDuration)}
      exiting={FadeOut.duration(animDuration)}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={{
        position: 'absolute',
        bottom: insets.bottom + 100,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: colors.toastBackground,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.xxl,
      }}
    >
      <Ionicons name="checkmark-circle" size={20} color={colors.toastIcon} />
      <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textOnPrimary, fontWeight: '500' }}>{message}</Text>
    </Animated.View>
  );
}
