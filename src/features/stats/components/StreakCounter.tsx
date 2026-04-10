import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { RADIUS, SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';

interface StreakCounterProps {
  count: number;
  longestStreak?: number;
  weekDays?: boolean[];
}

export function StreakCounter({ count, longestStreak, weekDays }: StreakCounterProps) {
  const { t, i18n } = useTranslation();
  const colors = useColors();

  const dayAbbrevs = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + i + 1); // Mon-Sun
    return d.toLocaleDateString(i18n.language, { weekday: 'narrow' });
  });

  const daysCompleted = weekDays || Array.from({ length: 7 }, (_, i) => i < count);

  return (
    <View
      style={{
        backgroundColor: colors.primarySubtle,
        borderRadius: RADIUS.lg,
        padding: SPACING[4],
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Text style={{ fontSize: 20 }}>{'\uD83D\uDD25'}</Text>
        <Text style={{ ...typography.bodyMedium, color: colors.primary }}>
          {count > 0 ? t('stats.streak', { count }) : t('stats.no_streak')}
        </Text>
      </View>

      {/* 7 circles */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: longestStreak ? 12 : 0 }}>
        {dayAbbrevs.map((abbrev, i) => {
          const done = daysCompleted[i];
          return (
            <View
              key={i}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: done ? colors.primarySubtle : colors.surface,
                borderWidth: done ? 0 : 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: done ? colors.primary : colors.textTertiary,
                }}
              >
                {abbrev}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Longest streak */}
      {longestStreak != null && longestStreak > 0 && (
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>
          {t('stats.longest_streak', { count: longestStreak })}
        </Text>
      )}
    </View>
  );
}
