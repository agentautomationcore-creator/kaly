import React, { useEffect } from 'react';
import { I18nManager, View, Text, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useColors } from '../lib/theme';
import { FONT_SIZE, RADIUS } from '../lib/constants';
import { ANIM } from '../lib/animations';
import { formatNumber } from '../lib/formatNumber';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  label?: string;
  showValue?: boolean;
  height?: number;
  delay?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  value,
  max,
  color,
  label,
  showValue = true,
  height = 8,
  delay = 0,
  style,
}: ProgressBarProps) {
  const colors = useColors();
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const barColor = color || colors.primary;

  const widthProgress = useSharedValue(0);

  useEffect(() => {
    widthProgress.value = withDelay(
      delay,
      withTiming(percentage, { duration: ANIM.slow.duration, easing: Easing.out(Easing.ease) }),
    );
  }, [percentage, delay, widthProgress]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${widthProgress.value}%`,
  }));

  return (
    <View style={style}>
      {(label || showValue) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          {label ? (
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, fontWeight: '500' }}>
              {label}
            </Text>
          ) : null}
          {showValue ? (
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>
              {formatNumber(Math.round(value))} / {formatNumber(Math.round(max))}
            </Text>
          ) : null}
        </View>
      )}
      <View
        style={{
          height,
          borderRadius: RADIUS.full,
          backgroundColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              borderRadius: RADIUS.full,
              backgroundColor: barColor,
              ...(I18nManager.isRTL ? { alignSelf: 'flex-end' } : {}),
            },
            animatedFillStyle,
          ]}
        />
      </View>
    </View>
  );
}
