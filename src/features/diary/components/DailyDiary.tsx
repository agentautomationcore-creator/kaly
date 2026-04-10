import React, { useState, useEffect } from 'react';
import { AccessibilityInfo, View, ScrollView, Text, Pressable, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { useDiary } from '../hooks/useDiary';
import { useDiaryStore } from '../store/diaryStore';
import { useAuthStore } from '../../../stores/authStore';
import { DateNavigator } from './DateNavigator';
import { DailyTotalsBar } from './DailyTotalsBar';
import { MealSection } from './MealSection';
import { WaterTracker } from './WaterTracker';
import { RecentMeals } from './RecentMeals';
import { ListSkeleton } from '../../../components/LoadingSkeleton';
import { useYesterdayMeals } from '../hooks/useYesterdayMeals';
import { FastingCard } from './FastingCard';
import { RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';
import type { MealType } from '../../../lib/types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface DailyDiaryProps {
  date?: string;
}

export function DailyDiary({ date: dateProp }: DailyDiaryProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { selectedDate, setSelectedDate } = useDiaryStore();
  const currentDate = dateProp || selectedDate;
  const { data: entries, isLoading, refetch } = useDiary(currentDate);
  const { data: yesterdayMeals } = useYesterdayMeals();
  const calorieGoal = profile?.daily_calories || 2000;

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); }, []);

  const entriesByMeal = MEALS.reduce((acc, meal) => {
    acc[meal] = (entries || []).filter((e) => e.meal_type === meal);
    return acc;
  }, {} as Record<MealType, typeof entries>);

  const totalCalories = (entries || []).reduce((s, e) => s + e.total_calories, 0);
  const totalProtein = (entries || []).reduce((s, e) => s + e.total_protein, 0);
  const totalCarbs = (entries || []).reduce((s, e) => s + e.total_carbs, 0);
  const totalFat = (entries || []).reduce((s, e) => s + e.total_fat, 0);

  const remainingCalories = calorieGoal - totalCalories;
  const proteinGoal = Math.round((calorieGoal * (profile?.protein_pct || 30) / 100) / 4);
  const carbsGoal = Math.round((calorieGoal * (profile?.carbs_pct || 40) / 100) / 4);
  const fatGoal = Math.round((calorieGoal * (profile?.fat_pct || 30) / 100) / 9);
  const remainingProtein = proteinGoal - totalProtein;
  const remainingCarbs = carbsGoal - totalCarbs;
  const remainingFat = fatGoal - totalFat;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: SPACING[12] }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.primary} />}
    >
      {/* Date navigator */}
      <View style={{ paddingVertical: SPACING[3] }}>
        <DateNavigator date={currentDate} onDateChange={setSelectedDate} />
      </View>

      {/* History limit warning for free tier */}
      {profile?.plan !== 'pro' && (() => {
        const created = profile?.created_at ? new Date(profile.created_at) : new Date();
        const daysUsed = Math.floor((Date.now() - created.getTime()) / 86400000);
        return daysUsed >= 5 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: SPACING[6], marginBottom: SPACING[3], padding: SPACING[3], backgroundColor: colors.errorSubtle, borderRadius: RADIUS.lg }}>
            <Ionicons name="information-circle-outline" size={20} color={colors.warning} />
            <Text style={{ flex: 1, ...typography.small, color: colors.textSecondary }}>
              {t('diary.history_warning', { days: 7 })}
            </Text>
            <Pressable onPress={() => router.push('/paywall')} accessibilityRole="button" style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
              <Text style={{ ...typography.smallMedium, color: colors.primary }}>{t('diary.upgrade')}</Text>
            </Pressable>
          </View>
        ) : null;
      })()}

      {/* Totals */}
      <DailyTotalsBar
        calories={totalCalories}
        protein={totalProtein}
        carbs={totalCarbs}
        fat={totalFat}
        calorieGoal={calorieGoal}
      />

      {/* Meals */}
      {isLoading ? (
        <ListSkeleton count={3} />
      ) : (
        <View style={{ gap: SPACING[3] }}>
          {MEALS.map((meal, idx) => (
            <Animated.View key={meal} entering={reduceMotion ? undefined : FadeInDown.delay(idx * 80).duration(300)}>
              <MealSection
                mealType={meal}
                entries={entriesByMeal[meal] || []}
                date={currentDate}
                yesterdayEntries={yesterdayMeals?.[meal]}
                remainingCalories={remainingCalories}
                remainingProtein={remainingProtein}
                remainingCarbs={remainingCarbs}
                remainingFat={remainingFat}
                dietType={profile?.diet_type}
                allergies={profile?.allergies}
              />
            </Animated.View>
          ))}
        </View>
      )}

      {/* Water */}
      <View style={{ paddingHorizontal: SPACING[6], marginTop: SPACING[4] }}>
        <WaterTracker date={currentDate} />
      </View>

      {/* Fasting */}
      <View style={{ paddingHorizontal: SPACING[6], marginTop: SPACING[3] }}>
        <FastingCard />
      </View>

      {/* Empty state */}
      {entries && entries.length === 0 && (
        <View style={{ alignItems: 'center', padding: SPACING[8] }}>
          <Text style={{ ...typography.h2, color: colors.textSecondary, marginBottom: SPACING[4] }}>
            {t('diary.emptyTitle')}
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: SPACING[6] }}>
            {t('diary.emptyDescription')}
          </Text>
          <View style={{ gap: SPACING[2], width: '100%' }}>
            {[
              { route: '/(tabs)/scan', icon: 'camera-outline' as const, label: t('scan.take_photo') },
              { route: '/barcode', icon: 'barcode-outline' as const, label: t('barcode.scan_barcode') },
              { route: '/food-search', icon: 'search-outline' as const, label: t('food_search.placeholder') },
              { route: '/manual-entry', icon: 'create-outline' as const, label: t('food_search.enter_manually') },
            ].map((item) => (
              <Pressable
                key={item.route}
                onPress={() => router.push(item.route as any)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[3], padding: SPACING[4], borderRadius: RADIUS.lg, backgroundColor: colors.surface, minHeight: MIN_TOUCH }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Ionicons name={item.icon} size={20} color={colors.primary} />
                <Text style={{ ...typography.bodyMedium, color: colors.textPrimary }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {entries && entries.length === 0 && (
        <View style={{ paddingHorizontal: SPACING[6], marginTop: SPACING[4] }}>
          <RecentMeals date={currentDate} />
        </View>
      )}
    </ScrollView>
  );
}
