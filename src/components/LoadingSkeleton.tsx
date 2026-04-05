import React, { useState, useEffect } from 'react';
import { View, ViewStyle, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '../lib/theme';
import { RADIUS, SPACING } from '../lib/constants';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = RADIUS.sm, style }: SkeletonProps) {
  const colors = useColors();
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (!reduceMotion) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1
      );
    }
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => reduceMotion ? { opacity: 0.5 } : { opacity: opacity.value });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ padding: SPACING.lg, gap: SPACING.lg }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ gap: SPACING.sm }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="100%" height={10} />
          <Skeleton width="40%" height={10} />
        </View>
      ))}
    </View>
  );
}
