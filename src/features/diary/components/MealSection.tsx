import React, { useRef } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '../../../lib/theme';
import { MealRow } from './MealRow';
import { MealSuggestionsCard } from './MealSuggestionsCard';
import { RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';
import { formatNumber } from '../../../lib/formatNumber';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import type { DiaryEntry } from '../types';
import type { MealType } from '../../../lib/types';

const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: '\u2600\uFE0F',
  lunch: '\uD83C\uDF5D',
  dinner: '\uD83C\uDF19',
  snack: '\uD83C\uDF6A',
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

export const MealSection = React.memo(function MealSection({
  mealType, entries, date, yesterdayEntries,
  remainingCalories, remainingProtein, remainingCarbs, remainingFat,
  dietType, allergies,
}: MealSectionProps) {
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

  const isEmpty = entries.length === 0;

  // Empty state — dashed border
  if (isEmpty && !(yesterdayEntries && yesterdayEntries.length > 0) && !(remainingCalories != null && remainingCalories > 0)) {
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/food-search', params: { mealType } })}
        accessibilityRole="button"
        accessibilityLabel={t('diary.add_food')}
        style={{
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: colors.border,
          borderRadius: RADIUS.lg,
          padding: SPACING[4],
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 72,
          marginHorizontal: SPACING[6],
          marginBottom: SPACING[3],
        }}
      >
        <Text style={{ ...typography.small, color: colors.textTertiary }}>
          {t('diary.tap_to_add', { meal: t(`diary.${mealType}`) })}
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: RADIUS.lg,
        marginHorizontal: SPACING[6],
        marginBottom: SPACING[3],
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING[4] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20 }}>{MEAL_EMOJIS[mealType]}</Text>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary }}>
            {t(`diary.${mealType}`)}
          </Text>
        </View>
        {totalCal > 0 && (
          <Text style={{ ...typography.smallMedium, color: colors.textSecondary }}>
            {formatNumber(Math.round(totalCal))} {t('common.kcal')}
          </Text>
        )}
      </View>

      {/* Divider */}
      {entries.length > 0 && <View style={{ height: 1, backgroundColor: colors.border }} />}

      {/* Entries */}
      {entries.map((entry) => (
        <MealRow key={entry.id} entry={entry} />
      ))}

      {/* Empty state with suggestions */}
      {isEmpty && (
        <>
          {yesterdayEntries && yesterdayEntries.length > 0 && (
            <Pressable
              onPress={handleRepeatYesterday}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: SPACING[4], minHeight: MIN_TOUCH }}
              accessibilityRole="button"
              accessibilityLabel={t('diary.repeat_yesterday')}
            >
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text style={{ ...typography.small, color: colors.primary, flex: 1 }}>
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

      {/* Footer — Add food */}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable
          onPress={() => router.push({ pathname: '/food-search', params: { mealType } })}
          accessibilityRole="button"
          accessibilityLabel={t('diary.add_food')}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: SPACING[3], minHeight: MIN_TOUCH }}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={{ ...typography.smallMedium, color: colors.primary }}>
            {t('diary.add_food')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});
