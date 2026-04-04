import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { FONT_SIZE } from '../../../lib/constants';
import { formatNumber } from '../../../lib/formatNumber';
import type { DayStats } from '../types';

interface WeeklyBarChartProps {
  days: DayStats[];
  goal?: number;
}

export const WeeklyBarChart = React.memo(function WeeklyBarChart({ days, goal = 2000 }: WeeklyBarChartProps) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  // B6: Empty state
  if (!days.length || days.every((d) => d.calories === 0)) {
    return (
      <View style={{ alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, textAlign: 'center' }}>
          {t('stats.no_data')}
        </Text>
      </View>
    );
  }

  const maxCal = Math.max(goal * 1.2, ...days.map((d) => d.calories));
  const barHeight = 120;

  // Goal line position (from bottom of bar area)
  const goalLineY = maxCal > 0 ? (goal / maxCal) * barHeight : 0;

  return (
    <View style={{ position: 'relative' }}>
      {/* Goal dashed line */}
      <View
        style={{
          position: 'absolute',
          bottom: 24 + goalLineY,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 1,
        }}
      >
        <View style={{ flex: 1, height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.textSecondary, opacity: 0.4 }} />
        <Text style={{ fontSize: 9, color: colors.textSecondary, marginStart: 4, opacity: 0.6 }}>
          {t('stats.goal')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: barHeight + 24 }}>
        {days.map((day) => {
          const h = maxCal > 0 ? (day.calories / maxCal) * barHeight : 0;
          const isToday = day.date === new Date().toISOString().split('T')[0];
          const isOver = day.calories > goal;
          const dayName = new Date(day.date).toLocaleDateString(i18n.language, { weekday: 'short' }).slice(0, 3);

          return (
            <View key={day.date} style={{ alignItems: 'center', flex: 1 }}>
              {day.calories > 0 && (
                <Text style={{ fontSize: 9, color: colors.textSecondary, marginBottom: 4 }}>
                  {formatNumber(Math.round(day.calories))}
                </Text>
              )}
              <View
                style={{
                  width: 24,
                  height: Math.max(4, h),
                  borderRadius: 4,
                  backgroundColor: isOver ? '#94A3B8' : isToday ? colors.primary : colors.primaryLight,
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isToday ? '700' : '400',
                  color: isToday ? colors.primary : colors.textSecondary,
                  marginTop: 4,
                }}
              >
                {dayName}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});
