import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, AccessibilityInfo, AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, cancelAnimation } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useColors } from '../../../lib/theme';
import { Card } from '../../../components/Card';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';
import { useFastingStore } from '../../../stores/fastingStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const PRESETS = [12, 14, 16, 18, 20];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const FastingCard = React.memo(function FastingCard() {
  const { t } = useTranslation();
  const colors = useColors();
  const { isActive, startTime, targetHours, start, stop, setTargetHours } = useFastingStore();
  const [elapsed, setElapsed] = useState(0);
  const [tick, setTick] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const completionFired = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // B20: Recalculate elapsed when app resumes from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && startTime) {
        setTick((prev) => prev + 1);
      }
    });
    return () => sub.remove();
  }, [startTime]);

  // Timer tick every second
  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsed(0);
      return;
    }
    // Set initial elapsed immediately
    setElapsed(Math.floor((Date.now() - startTime) / 1000));

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, startTime, tick]);

  const targetSeconds = targetHours * 3600;
  const progress = isActive ? Math.min(elapsed / targetSeconds, 1) : 0;
  const completed = progress >= 1;

  // A13: Completion haptic + notification
  useEffect(() => {
    if (completed && !completionFired.current) {
      completionFired.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Notifications.scheduleNotificationAsync({
        content: { title: t('fasting.complete_title'), body: t('fasting.complete_body') },
        trigger: null,
      }).catch(() => {});
    }
    if (!isActive) {
      completionFired.current = false;
    }
  }, [completed, isActive]);

  // Ring animation
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      animatedProgress.value = progress;
    } else {
      animatedProgress.value = withTiming(progress, { duration: 500 });
    }
    return () => cancelAnimation(animatedProgress);
  }, [progress, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isActive) {
      stop();
    } else {
      start(targetHours);
    }
  }, [isActive, targetHours]);

  const ringColor = completed ? colors.success : colors.primary;

  return (
    <Card>
      <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: SPACING.md }}>
        {t('fasting.title')}
      </Text>

      {/* Ring + timer */}
      <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size} height={size}>
            <Defs>
              <SvgGradient id="fastingCardGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#8B5CF6" />
                <Stop offset="1" stopColor="#EC4899" />
              </SvgGradient>
            </Defs>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.border}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={completed ? colors.success : 'url(#fastingCardGrad)'}
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
            <Text accessibilityLiveRegion="polite" style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: completed ? colors.success : colors.text }}>
              {formatTime(elapsed)}
            </Text>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>
              / {targetHours}:00:00
            </Text>
          </View>
        </View>

        {completed && (
          <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.success, marginTop: SPACING.sm }}>
            {t('fasting.completed')}
          </Text>
        )}
      </View>

      {/* Presets — only when not active */}
      {!isActive && (
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg, justifyContent: 'center' }}>
          {PRESETS.map((h) => (
            <Pressable
              key={h}
              onPress={() => setTargetHours(h)}
              accessibilityLabel={`${h} ${t('fasting.hours')}`}
              accessibilityRole="button"
              style={{
                minHeight: MIN_TOUCH,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                borderRadius: RADIUS.md,
                backgroundColor: targetHours === h ? colors.primaryLight : colors.surface,
                borderWidth: 1.5,
                borderColor: targetHours === h ? colors.primary : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '600', color: targetHours === h ? colors.primary : colors.textSecondary }}>
                {h}{t('fasting.hours_suffix')}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Start / Stop button */}
      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={isActive ? t('fasting.stop') : t('fasting.start')}
        style={{
          minHeight: MIN_TOUCH,
          borderRadius: RADIUS.md,
          backgroundColor: isActive ? colors.danger : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: SPACING.md,
        }}
      >
        <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.textOnPrimary }}>
          {isActive ? t('fasting.stop') : t('fasting.start')}
        </Text>
      </Pressable>
    </Card>
  );
});
