import React, { useState, useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { useHealthKit } from '../../../hooks/useHealthKit';
import { useWeekStats } from '../hooks/useStats';
import { useDiary } from '../../diary/hooks/useDiary';
import { useAuthStore } from '../../../stores/authStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { CalorieRing } from './CalorieRing';
import { MacroBars } from './MacroBars';
import { WeeklyBarChart } from './WeeklyBarChart';
import { StreakCounter } from './StreakCounter';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { Card } from '../../../components/Card';
import { ListSkeleton } from '../../../components/LoadingSkeleton';
import { SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';
import { formatNumber } from '../../../lib/formatNumber';

export function StatsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const profile = useAuthStore((s) => s.profile);
  const showStreak = useSettingsStore((s) => s.showStreak);
  const today = new Date().toISOString().split('T')[0];
  const { data: todayEntries } = useDiary(today);
  const { data: weekStats, isLoading } = useWeekStats();
  const [periodIdx, setPeriodIdx] = useState(0);

  const { isAvailable: hkAvailable, healthKitEnabled: hkEnabled, getTodaySteps, getTodayActiveCalories } = useHealthKit();
  const [steps, setSteps] = useState(0);
  const [activeCalories, setActiveCalories] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (hkAvailable && hkEnabled) {
        getTodaySteps().then(setSteps);
        getTodayActiveCalories().then(setActiveCalories);
      }
    }, [hkAvailable, hkEnabled])
  );

  const calorieGoal = profile?.daily_calories || 2000;
  const proteinGoal = calorieGoal * (profile?.protein_pct || 30) / 100 / 4;
  const carbsGoal = calorieGoal * (profile?.carbs_pct || 40) / 100 / 4;
  const fatGoal = calorieGoal * (profile?.fat_pct || 30) / 100 / 9;

  const todayCal = (todayEntries || []).reduce((s, e) => s + e.total_calories, 0);
  const todayProtein = (todayEntries || []).reduce((s, e) => s + e.total_protein, 0);
  const todayCarbs = (todayEntries || []).reduce((s, e) => s + e.total_carbs, 0);
  const todayFat = (todayEntries || []).reduce((s, e) => s + e.total_fat, 0);

  if (isLoading) return <ListSkeleton count={4} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: SPACING[4], paddingBottom: 100 }}
    >
      {/* Title */}
      <Text style={{ ...typography.title, color: colors.textPrimary, marginBottom: SPACING[4] }}>
        {t('stats.title')}
      </Text>

      {/* Period selector */}
      <View style={{ marginBottom: SPACING[6] }}>
        <SegmentedControl
          items={[t('stats.week'), t('stats.month'), t('stats.three_months')]}
          activeIndex={periodIdx}
          onChange={setPeriodIdx}
        />
      </View>

      {/* Streak */}
      {showStreak && (
        <View style={{ marginBottom: SPACING[4] }}>
          <StreakCounter count={weekStats?.streak || 0} />
        </View>
      )}

      {/* Apple Health */}
      {hkAvailable && hkEnabled && (steps > 0 || activeCalories > 0) && (
        <Card style={{ marginBottom: SPACING[4] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {steps > 0 && (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Ionicons name="footsteps-outline" size={24} color={colors.primary} />
                <Text style={{ ...typography.h2, color: colors.textPrimary }}>{formatNumber(steps)}</Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('stats.steps')}</Text>
              </View>
            )}
            {activeCalories > 0 && (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Ionicons name="flame-outline" size={24} color={colors.warning} />
                <Text style={{ ...typography.h2, color: colors.textPrimary }}>{formatNumber(activeCalories)}</Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('stats.active_calories')}</Text>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Calorie ring */}
      <Card style={{ marginBottom: SPACING[4], alignItems: 'center' }}>
        <CalorieRing current={todayCal} goal={calorieGoal} />
      </Card>

      {/* Macro bars */}
      <Card style={{ marginBottom: SPACING[4] }}>
        <MacroBars protein={todayProtein} carbs={todayCarbs} fat={todayFat} proteinGoal={Math.round(proteinGoal)} carbsGoal={Math.round(carbsGoal)} fatGoal={Math.round(fatGoal)} />
      </Card>

      {/* Average daily + Weekly chart */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: SPACING[3] }}>
          <Text style={{ ...typography.smallMedium, color: colors.textSecondary }}>{t('stats.avg_calories')}:</Text>
          <Text style={{ ...typography.h1, color: colors.primary }}>{formatNumber(Math.round(weekStats?.avgCalories || 0))}</Text>
        </View>
        <WeeklyBarChart days={weekStats?.days || []} goal={calorieGoal} />
      </Card>
    </ScrollView>
  );
}
