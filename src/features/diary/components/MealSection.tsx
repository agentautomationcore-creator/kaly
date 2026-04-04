import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '../../../lib/theme';
import { Card } from '../../../components/Card';
import { MealRow } from './MealRow';
import { FONT_SIZE } from '../../../lib/constants';
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
}

export const MealSection = React.memo(function MealSection({ mealType, entries, date, yesterdayEntries }: MealSectionProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const totalCal = entries.reduce((s, e) => s + e.total_calories, 0);
  const yesterdayCal = (yesterdayEntries || []).reduce((s, e) => s + e.total_calories, 0);

  const handleRepeatYesterday = async () => {
    if (!user || !yesterdayEntries?.length) return;
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
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: entries.length > 0 ? 12 : 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
          onPress={() => router.push('/(tabs)/scan')}
          accessibilityLabel={t('diary.add_food')}
          accessibilityRole="button"
          style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {entries.length > 0 ? (
        <View style={{ gap: 4 }}>
          {entries.map((entry) => (
            <MealRow key={entry.id} entry={entry} />
          ))}
        </View>
      ) : yesterdayEntries && yesterdayEntries.length > 0 ? (
        <Pressable
          onPress={handleRepeatYesterday}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, minHeight: 44 }}
          accessibilityRole="button"
          accessibilityLabel={t('diary.repeat_yesterday')}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, flex: 1 }}>
            {t('diary.repeat_yesterday')} ({formatNumber(Math.round(yesterdayCal))} {t('common.kcal')})
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
});
