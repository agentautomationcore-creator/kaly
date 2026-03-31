import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '../../../lib/theme';
import type { DayStats } from '../types';

interface WeeklyBarChartProps {
  days: DayStats[];
  goal?: number;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyBarChart = React.memo(function WeeklyBarChart({ days, goal = 2000 }: WeeklyBarChartProps) {
  const colors = useColors();
  const maxCal = Math.max(goal, ...days.map((d) => d.calories));
  const barHeight = 120;

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: barHeight + 24 }}>
      {days.map((day, i) => {
        const h = maxCal > 0 ? (day.calories / maxCal) * barHeight : 0;
        const isToday = day.date === new Date().toISOString().split('T')[0];
        const isOver = day.calories > goal;
        const dayName = new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).slice(0, 3);

        return (
          <View key={day.date} style={{ alignItems: 'center', flex: 1 }}>
            {day.calories > 0 && (
              <Text style={{ fontSize: 9, color: colors.textSecondary, marginBottom: 4 }}>
                {Math.round(day.calories)}
              </Text>
            )}
            <View
              style={{
                width: 24,
                height: Math.max(4, h),
                borderRadius: 4,
                backgroundColor: isOver ? colors.danger : isToday ? colors.primary : colors.primaryLight,
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
  );
});
