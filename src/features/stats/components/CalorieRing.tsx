import React, { useState, useEffect } from 'react';
import { View, Text, AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, cancelAnimation } from 'react-native-reanimated';
import { useColors } from '../../../lib/theme';
import { formatNumber } from '../../../lib/formatNumber';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieRingProps {
  current: number;
  goal: number;
  size?: number;
}

export const CalorieRing = React.memo(function CalorieRing({ current, goal, size = 160 }: CalorieRingProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(1, current / goal);

  const progress = useSharedValue(0);
  React.useEffect(() => {
    if (reduceMotion) {
      progress.value = percentage;
    } else {
      progress.value = withTiming(percentage, { duration: 800 });
    }
    return () => {
      cancelAnimation(progress);
    };
  }, [percentage, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  // Neutral color when over goal — no guilt-tripping
  const ringColor = current > goal ? '#94A3B8' : colors.primary;
  const textColor = current > goal ? '#64748B' : colors.primary;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surface}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: '800', color: textColor }}>
          {formatNumber(Math.round(current))}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>/ {formatNumber(goal)} {t('common.kcal')}</Text>
      </View>
    </View>
  );
});
