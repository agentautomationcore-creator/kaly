import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { useRecentMeals } from '../hooks/useRecentMeals';
import { Card } from '../../../components/Card';
import { FONT_SIZE, RADIUS, MIN_TOUCH } from '../../../lib/constants';
import { formatNumber } from '../../../lib/formatNumber';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import type { DiaryEntry } from '../types';

interface RecentMealsProps {
  date: string;
}

export const RecentMeals = React.memo(function RecentMeals({ date }: RecentMealsProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: meals } = useRecentMeals();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  if (!meals || meals.length === 0) return null;

  const repeatMeal = async (entry: DiaryEntry) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('diary_entries').insert({
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
      if (error) throw error;
      track('meal_repeated');
      qc.invalidateQueries({ queryKey: ['diary', date] });
    } catch (e) {
      Alert.alert(t('common.error'), t('errors.generic'));
      captureException(e, { feature: 'repeat_meal' });
    }
  };

  return (
    <Card>
      <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
        {t('diary.recent')}
      </Text>

      {meals.slice(0, 5).map((entry) => (
        <Pressable
          key={entry.id}
          onPress={() => repeatMeal(entry)}
          accessibilityRole="button"
          accessibilityLabel={`${t('diary.repeat_yesterday')}: ${entry.food_name}`}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            minHeight: MIN_TOUCH,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
              {entry.food_name}
            </Text>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>
              {formatNumber(Math.round(entry.total_calories))} {t('common.kcal')}
            </Text>
          </View>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </Pressable>
      ))}
    </Card>
  );
});
