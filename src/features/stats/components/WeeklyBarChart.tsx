import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useColors } from '../../../lib/theme';
import { RADIUS, SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';
import { formatNumber } from '../../../lib/formatNumber';
import type { DayStats } from '../types';

interface WeeklyBarChartProps {
  days: DayStats[];
  goal?: number;
}

function AnimatedBar({ height, color, opacity, delay }: { height: number; color: string; opacity: number; delay: number }) {
  const barHeight = useSharedValue(0);

  useEffect(() => {
    barHeight.value = withTiming(height, { duration: 600, easing: Easing.out(Easing.ease) });
  }, [height, barHeight]);

  const style = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          borderTopLeftRadius: RADIUS.xs,
          borderTopRightRadius: RADIUS.xs,
          backgroundColor: color,
          opacity,
        },
        style,
      ]}
    />
  );
}

export const WeeklyBarChart = React.memo(function WeeklyBarChart({ days, goal = 2000 }: WeeklyBarChartProps) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const [tooltip, setTooltip] = useState<string | null>(null);

  if (!days.length || days.every((d) => d.calories === 0)) {
    return (
      <View style={{ alignItems: 'center', padding: SPACING[6] }}>
        <Text style={{ ...typography.small, color: colors.textSecondary, textAlign: 'center' }}>
          {t('stats.no_data')}
        </Text>
      </View>
    );
  }

  const maxCal = Math.max(goal * 1.2, ...days.map((d) => d.calories));
  const containerHeight = 100;

  return (
    <View>
      {tooltip && (
        <Text style={{ ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginBottom: 4 }}>
          {tooltip}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: containerHeight, gap: 4 }}>
        {days.map((day, idx) => {
          const h = maxCal > 0 ? (day.calories / maxCal) * containerHeight : 0;
          const isToday = day.date === new Date().toISOString().split('T')[0];
          const dayName = new Date(day.date)
            .toLocaleDateString(i18n.language, { weekday: 'short' })
            .slice(0, 2)
            .toUpperCase();

          return (
            <Pressable
              key={day.date}
              onPress={() => setTooltip(`${dayName}: ${formatNumber(Math.round(day.calories))} ${t('common.kcal')}`)}
              style={{ flex: 1, alignItems: 'center' }}
              accessibilityLabel={`${dayName} ${formatNumber(Math.round(day.calories))} ${t('common.kcal')}`}
            >
              <AnimatedBar
                height={Math.max(4, h)}
                color={colors.primary}
                opacity={isToday ? 1.0 : 0.7}
                delay={idx * 80}
              />
            </Pressable>
          );
        })}
      </View>
      {/* Day labels */}
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
        {days.map((day) => {
          const dayName = new Date(day.date)
            .toLocaleDateString(i18n.language, { weekday: 'short' })
            .slice(0, 2)
            .toUpperCase();
          return (
            <View key={day.date} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ ...typography.overline, color: colors.textTertiary, fontSize: 10 }}>
                {dayName}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});
