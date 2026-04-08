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
import { Card } from '../../../components/Card';
import { ListSkeleton } from '../../../components/LoadingSkeleton';
import { FONT_SIZE } from '../../../lib/constants';
import { formatNumber } from '../../../lib/formatNumber';

export function StatsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const profile = useAuthStore((s) => s.profile);
  const showStreak = useSettingsStore((s) => s.showStreak);
  const today = new Date().toISOString().split('T')[0];
  const { data: todayEntries } = useDiary(today);
  const { data: weekStats, isLoading } = useWeekStats();

  const { isAvailable: hkAvailable, healthKitEnabled: hkEnabled, getTodaySteps, getTodayActiveCalories } = useHealthKit();
  const [steps, setSteps] = useState(0);
  const [activeCalories, setActiveCalories] = useState(0);
  // Refresh HealthKit data when screen gains focus (e.g. returning from other tabs)
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
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
    >
      {/* Apple Health — steps & active calories */}
      {hkAvailable && hkEnabled && (steps > 0 || activeCalories > 0) && (
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {steps > 0 && (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Ionicons name="footsteps-outline" size={24} color={colors.primary} />
                <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text }}>{formatNumber(steps)}</Text>
                <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>{t('stats.steps')}</Text>
              </View>
            )}
            {activeCalories > 0 && (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Ionicons name="flame-outline" size={24} color={colors.warning} />
                <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text }}>{formatNumber(activeCalories)}</Text>
                <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>{t('stats.active_calories')}</Text>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Today's calorie ring */}
      <Card style={{ marginBottom: 16, alignItems: 'center' }}>
        <Text accessibilityRole="header" style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
          {t('stats.today_calories')}
        </Text>
        <CalorieRing current={todayCal} goal={calorieGoal} />
      </Card>

      {/* Macro bars */}
      <Card style={{ marginBottom: 16 }}>
        <MacroBars protein={todayProtein} carbs={todayCarbs} fat={todayFat} proteinGoal={Math.round(proteinGoal)} carbsGoal={Math.round(carbsGoal)} fatGoal={Math.round(fatGoal)} />
      </Card>

      {/* Streak — only shown if enabled in settings */}
      {showStreak && <StreakCounter count={weekStats?.streak || 0} />}

      {/* Weekly chart */}
      <Card style={{ marginTop: 16 }}>
        <Text accessibilityRole="header" style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
          {t('stats.weekly')}
        </Text>
        <WeeklyBarChart days={weekStats?.days || []} goal={calorieGoal} />
        {weekStats && weekStats.avgCalories > 0 && (
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, textAlign: 'center', marginTop: 12 }}>
            {t('stats.avg_calories')}: {formatNumber(Math.round(weekStats.avgCalories))} {t('common.kcal')}
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}
