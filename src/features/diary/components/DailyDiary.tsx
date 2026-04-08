import React from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
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
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';
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
  const { data: entries, isLoading } = useDiary(currentDate);
  const { data: yesterdayMeals } = useYesterdayMeals();
  const calorieGoal = profile?.daily_calories || 2000;

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
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <DateNavigator date={currentDate} onDateChange={setSelectedDate} />

      {/* History limit warning for free tier */}
      {profile?.plan !== 'pro' && (() => {
        const created = profile?.created_at ? new Date(profile.created_at) : new Date();
        const daysUsed = Math.floor((Date.now() - created.getTime()) / 86400000);
        return daysUsed >= 5 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, padding: SPACING.md, backgroundColor: colors.warningLight, borderRadius: RADIUS.md }}>
            <Ionicons name="information-circle-outline" size={20} color={colors.warning} />
            <Text style={{ flex: 1, fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>
              {t('diary.history_warning', { days: 7 })}
            </Text>
            <Pressable onPress={() => router.push('/paywall')} accessibilityRole="button" accessibilityLabel={t('diary.upgrade')} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
              <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, fontWeight: '600' }}>{t('diary.upgrade')}</Text>
            </Pressable>
          </View>
        ) : null;
      })()}

      <DailyTotalsBar
        calories={totalCalories}
        protein={totalProtein}
        carbs={totalCarbs}
        fat={totalFat}
        calorieGoal={calorieGoal}
      />

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : (
        <View style={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm }}>
          {MEALS.map((meal) => (
            <MealSection
              key={meal}
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
          ))}
        </View>
      )}

      <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
        <WaterTracker date={currentDate} />
      </View>

      <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.sm }}>
        <FastingCard />
      </View>

      {entries && entries.length === 0 && (
        <View style={{ alignItems: 'center', padding: SPACING.xxl }}>
          <Text accessibilityRole="header" style={{ fontSize: FONT_SIZE.lg, color: colors.textSecondary, marginBottom: SPACING.lg }}>
            {t('diary.emptyTitle')}
          </Text>
          <Text style={{ fontSize: FONT_SIZE.md, color: colors.textSecondary, marginBottom: SPACING.xl }}>
            {t('diary.emptyDescription')}
          </Text>
          <View style={{ gap: SPACING.sm, width: '100%' }}>
            <Pressable onPress={() => router.push('/(tabs)/scan')} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.md, backgroundColor: colors.surface, minHeight: MIN_TOUCH }} accessibilityRole="button" accessibilityLabel={t('scan.take_photo')}>
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '500', color: colors.text }}>{t('scan.take_photo')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/barcode')} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.md, backgroundColor: colors.surface, minHeight: MIN_TOUCH }} accessibilityRole="button" accessibilityLabel={t('barcode.scan_barcode')}>
              <Ionicons name="barcode-outline" size={20} color={colors.primary} />
              <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '500', color: colors.text }}>{t('barcode.scan_barcode')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/food-search')} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.md, backgroundColor: colors.surface, minHeight: MIN_TOUCH }} accessibilityRole="button" accessibilityLabel={t('food_search.placeholder')}>
              <Ionicons name="search-outline" size={20} color={colors.primary} />
              <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '500', color: colors.text }}>{t('food_search.placeholder')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/manual-entry')} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.md, backgroundColor: colors.surface, minHeight: MIN_TOUCH }} accessibilityRole="button" accessibilityLabel={t('food_search.enter_manually')}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '500', color: colors.text }}>{t('food_search.enter_manually')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {entries && entries.length === 0 && (
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
          <RecentMeals date={currentDate} />
        </View>
      )}
    </ScrollView>
  );
}
