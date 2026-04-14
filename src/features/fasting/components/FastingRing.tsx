import React, { useState, useEffect } from 'react';
import { View, Text, AccessibilityInfo } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, cancelAnimation } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { typography } from '../../../lib/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FastingRingProps {
  elapsed: number;
  targetSeconds: number;
  size?: number;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function FastingRing({ elapsed, targetSeconds, size = 220 }: FastingRingProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(elapsed / targetSeconds, 1);

  const animatedProgress = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) {
      animatedProgress.value = progress;
    } else {
      animatedProgress.value = withTiming(progress, { duration: 500 });
    }
    return () => cancelAnimation(animatedProgress);
  }, [progress, reduceMotion, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const targetHours = Math.floor(targetSeconds / 3600);
  const targetMins = Math.floor((targetSeconds % 3600) / 60);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="fastingGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#8B5CF6" />
            <Stop offset="1" stopColor="#EC4899" />
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
          stroke="url(#fastingGrad)"
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
          accessibilityLiveRegion="polite"
          style={{ ...typography.h1, color: colors.textPrimary }}
        >
          {formatTime(elapsed)}
        </Text>
        <Text style={{ ...typography.small, color: colors.textSecondary }}>
          {t('fasting.elapsed')}
        </Text>
        <Text style={{ ...typography.caption, color: colors.textTertiary }}>
          {targetHours}:{targetMins.toString().padStart(2, '0')} {t('fasting.goal')}
        </Text>
      </View>
    </View>
  );
}
