import React, { useState, useEffect } from 'react';
import { View, Text, AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, cancelAnimation } from 'react-native-reanimated';
import { ANIM } from '../../../lib/animations';
import { useColors, useThemeMode } from '../../../lib/theme';
import { formatNumber } from '../../../lib/formatNumber';
import { typography } from '../../../lib/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieRingProps {
  current: number;
  goal: number;
  size?: number;
}

export const CalorieRing = React.memo(function CalorieRing({ current, goal, size = 200 }: CalorieRingProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const themeMode = useThemeMode();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(1, current / goal);
  const isOver = current > goal;
  const remaining = Math.max(0, goal - current);
  const overBy = current - goal;

  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) {
      progress.value = isOver ? 1 : percentage;
    } else {
      progress.value = withTiming(isOver ? 1 : percentage, ANIM.ring);
    }
    return () => cancelAnimation(progress);
  }, [percentage, isOver, reduceMotion, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const gradStart = themeMode === 'dark' ? '#4ADE80' : '#22C55E';
  const gradEnd = themeMode === 'dark' ? '#38BDF8' : '#0EA5E9';

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel={
        isOver
          ? t('stats.over_goal', { amount: formatNumber(overBy) })
          : t('stats.remaining', { amount: formatNumber(remaining) })
      }
    >
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradStart} />
            <Stop offset="1" stopColor={gradEnd} />
          </SvgGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Fill */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
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
        <Text
          style={{
            ...typography.display,
            color: isOver ? colors.warning : colors.textPrimary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {isOver ? formatNumber(overBy) : formatNumber(remaining)}
        </Text>
        <Text style={{ ...typography.small, color: colors.textSecondary }}>
          {isOver ? t('stats.over') : t('stats.remaining_label')}
        </Text>
        <Text style={{ ...typography.caption, color: colors.textTertiary }}>
          {t('stats.of_goal', { goal: formatNumber(goal) })}
        </Text>
      </View>
    </View>
  );
});
