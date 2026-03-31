import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { useWeekStats } from '../hooks/useStats';
import { useDiary } from '../../diary/hooks/useDiary';
import { CalorieRing } from './CalorieRing';
import { MacroBars } from './MacroBars';
import { WeeklyBarChart } from './WeeklyBarChart';
import { StreakCounter } from './StreakCounter';
import { Card } from '../../../components/Card';
import { ListSkeleton } from '../../../components/LoadingSkeleton';
import { FONT_SIZE } from '../../../lib/constants';

export function StatsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const today = new Date().toISOString().split('T')[0];
  const { data: todayEntries } = useDiary(today);
  const { data: weekStats, isLoading } = useWeekStats();

  const todayCal = (todayEntries || []).reduce((s, e) => s + e.total_calories, 0);
  const todayProtein = (todayEntries || []).reduce((s, e) => s + e.total_protein, 0);
  const todayCarbs = (todayEntries || []).reduce((s, e) => s + e.total_carbs, 0);
  const todayFat = (todayEntries || []).reduce((s, e) => s + e.total_fat, 0);

  if (isLoading) return <ListSkeleton count={4} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
    >
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 20 }}>
        {t('stats.title')}
      </Text>

      {/* Today's calorie ring */}
      <Card style={{ marginBottom: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
          {t('stats.today_calories')}
        </Text>
        <CalorieRing current={todayCal} goal={2000} />
      </Card>

      {/* Macro bars */}
      <Card style={{ marginBottom: 16 }}>
        <MacroBars protein={todayProtein} carbs={todayCarbs} fat={todayFat} />
      </Card>

      {/* Streak */}
      <StreakCounter count={weekStats?.streak || 0} />

      {/* Weekly chart */}
      <Card style={{ marginTop: 16 }}>
        <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
          {t('stats.weekly')}
        </Text>
        <WeeklyBarChart days={weekStats?.days || []} />
        {weekStats && weekStats.avgCalories > 0 && (
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, textAlign: 'center', marginTop: 12 }}>
            {t('stats.avg_calories')}: {Math.round(weekStats.avgCalories)} {t('common.kcal')}
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}
