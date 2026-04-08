import React, { useRef } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '../../../lib/theme';
import { Card } from '../../../components/Card';
import { MealRow } from './MealRow';
import { MealSuggestionsCard } from './MealSuggestionsCard';
import { FONT_SIZE, MIN_TOUCH, SPACING } from '../../../lib/constants';
import { formatNumber } from '../../../lib/formatNumber';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import type { DiaryEntry } from '../types';
import type { MealType } from '../../../lib/types';

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'fast-food-outline',
};

interface MealSectionProps {
  mealType: MealType;
  entries: DiaryEntry[];
  date: string;
  yesterdayEntries?: DiaryEntry[];
  remainingCalories?: number;
  remainingProtein?: number;
  remainingCarbs?: number;
  remainingFat?: number;
  dietType?: string;
  allergies?: string[];
}

export const MealSection = React.memo(function MealSection({ mealType, entries, date, yesterdayEntries, remainingCalories, remainingProtein, remainingCarbs, remainingFat, dietType, allergies }: MealSectionProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const totalCal = entries.reduce((s, e) => s + e.total_calories, 0);
  const yesterdayCal = (yesterdayEntries || []).reduce((s, e) => s + e.total_calories, 0);
  const submitting = useRef(false);

  const handleRepeatYesterday = async () => {
    if (!user || !yesterdayEntries?.length) return;
    if (submitting.current) return;
    submitting.current = true;
    try {
      for (const entry of yesterdayEntries) {
        await supabase.from('diary_entries').insert({
          user_id: user.id,
          logged_at: date,
          meal_type: entry.meal_type,
          food_name: entry.food_name,
          food_name_en: entry.food_name_en,
          food_items: entry.food_items,
          quantity_g: entry.quantity_g,
          total_calories: entry.total_calories,
          total_protein: entry.total_protein,
          total_carbs: entry.total_carbs,
          total_fat: entry.total_fat,
          total_fiber: entry.total_fiber,
          confidence: entry.confidence,
          entry_method: entry.entry_method,
          source_entry_id: entry.id,
        });
      }
      track('meal_repeated');
      qc.invalidateQueries({ queryKey: ['diary', date] });
    } catch (e) {
      Alert.alert(t('common.error'), t('errors.generic'));
      captureException(e, { feature: 'repeat_yesterday' });
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: entries.length > 0 ? SPACING.md : 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Ionicons name={MEAL_ICONS[mealType] as any} size={18} color={colors.textSecondary} />
          <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
            {t(`diary.${mealType}`)}
          </Text>
          {totalCal > 0 && (
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>
              {formatNumber(Math.round(totalCal))} {t('common.kcal')}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/food-search', params: { mealType } })}
          accessibilityLabel={t('diary.add_food')}
          accessibilityRole="button"
          style={{ minHeight: MIN_TOUCH, minWidth: 44, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {entries.length > 0 ? (
        <View style={{ gap: SPACING.xs }}>
          {entries.map((entry) => (
            <MealRow key={entry.id} entry={entry} />
          ))}
        </View>
      ) : (
        <>
          {yesterdayEntries && yesterdayEntries.length > 0 && (
            <Pressable
              onPress={handleRepeatYesterday}
              style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, minHeight: MIN_TOUCH }}
              accessibilityRole="button"
              accessibilityLabel={t('diary.repeat_yesterday')}
            >
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, flex: 1 }}>
                {t('diary.repeat_yesterday')} ({formatNumber(Math.round(yesterdayCal))} {t('common.kcal')})
              </Text>
            </Pressable>
          )}
          {remainingCalories != null && remainingCalories > 0 && (
            <MealSuggestionsCard
              mealType={mealType}
              remainingCalories={remainingCalories}
              remainingProtein={remainingProtein || 0}
              remainingCarbs={remainingCarbs || 0}
              remainingFat={remainingFat || 0}
              dietType={dietType}
              allergies={allergies}
              date={date}
            />
          )}
        </>
      )}
    </Card>
  );
});
