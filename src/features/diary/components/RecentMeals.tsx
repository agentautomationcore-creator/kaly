import React, { useRef } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '../../../lib/theme';
import { useRecentMeals } from '../hooks/useRecentMeals';
import { useFavoriteMeals } from '../hooks/useFavoriteMeals';
import { RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';
import { formatNumber } from '../../../lib/formatNumber';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import type { DiaryEntry } from '../types';
import type { MealType } from '../../../lib/types';

function autoSelectMeal(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 17) return 'snack';
  return 'dinner';
}

interface RecentMealsProps {
  date: string;
}

export const RecentMeals = React.memo(function RecentMeals({ date }: RecentMealsProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: recentMeals } = useRecentMeals();
  const { data: favorites } = useFavoriteMeals();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const submitting = useRef(false);

  // Build combined list: favorites first, then recent (deduped)
  const favoriteNames = new Set((favorites || []).map((f) => f.food_name_en));
  const recentOnly = (recentMeals || []).filter((m) => !favoriteNames.has(m.food_name_en || m.food_name));
  const hasFavorites = (favorites || []).length > 0;
  const hasRecent = recentOnly.length > 0;

  if (!hasFavorites && !hasRecent) return null;

  const repeatMeal = async (entry: Partial<DiaryEntry> & { food_name: string; food_name_en?: string }) => {
    if (!user || submitting.current) return;
    submitting.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { error } = await supabase.from('diary_entries').insert({
        user_id: user.id,
        logged_at: date,
        meal_type: entry.meal_type || autoSelectMeal(),
        food_name: entry.food_name,
        food_name_en: entry.food_name_en || entry.food_name,
        food_items: entry.food_items || [],
        quantity_g: entry.quantity_g || null,
        total_calories: entry.total_calories || 0,
        total_protein: entry.total_protein || 0,
        total_carbs: entry.total_carbs || 0,
        total_fat: entry.total_fat || 0,
        total_fiber: entry.total_fiber || 0,
        confidence: entry.confidence || null,
        entry_method: entry.entry_method || 'manual',
        source_entry_id: entry.id || null,
      });
      if (error) throw error;
      track('meal_repeated');
      qc.invalidateQueries({ queryKey: ['diary', date] });
    } catch (e) {
      Alert.alert(t('common.error'), t('errors.generic'));
      captureException(e, { feature: 'repeat_meal' });
    } finally {
      submitting.current = false;
    }
  };

  return (
    <View style={{ gap: SPACING[2] }}>
      {/* Section title */}
      <Text style={{ ...typography.smallMedium, color: colors.textSecondary, paddingHorizontal: SPACING[6] }}>
        {hasFavorites ? t('diary.favorites_and_recent') : t('diary.recent')}
      </Text>

      {/* Horizontal scroll of chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING[6], gap: SPACING[2] }}
      >
        {/* Favorites first */}
        {(favorites || []).slice(0, 10).map((fav) => (
          <Pressable
            key={`fav-${fav.id}`}
            onPress={() => repeatMeal({
              food_name: fav.food_name,
              food_name_en: fav.food_name_en,
              food_items: fav.food_data.food_items,
              quantity_g: fav.food_data.quantity_g || undefined,
              total_calories: fav.food_data.total_calories,
              total_protein: fav.food_data.total_protein,
              total_carbs: fav.food_data.total_carbs,
              total_fat: fav.food_data.total_fat,
              total_fiber: fav.food_data.total_fiber,
              entry_method: fav.food_data.entry_method,
              confidence: fav.food_data.confidence || undefined,
            })}
            accessibilityRole="button"
            accessibilityLabel={`${t('diary.repeat')}: ${fav.food_name}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING[1],
              paddingHorizontal: SPACING[3],
              paddingVertical: SPACING[2],
              backgroundColor: colors.primarySubtle,
              borderRadius: RADIUS.full,
              minHeight: MIN_TOUCH,
            }}
          >
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={{ ...typography.small, color: colors.primary }} numberOfLines={1}>
              {fav.food_name}
            </Text>
            <Text style={{ ...typography.caption, color: colors.textTertiary }}>
              {formatNumber(Math.round(fav.food_data.total_calories))}
            </Text>
          </Pressable>
        ))}

        {/* Recent meals */}
        {recentOnly.slice(0, 10).map((entry) => (
          <Pressable
            key={`recent-${entry.id}`}
            onPress={() => repeatMeal(entry)}
            accessibilityRole="button"
            accessibilityLabel={`${t('diary.repeat')}: ${entry.food_name}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING[1],
              paddingHorizontal: SPACING[3],
              paddingVertical: SPACING[2],
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: RADIUS.full,
              minHeight: MIN_TOUCH,
            }}
          >
            <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
            <Text style={{ ...typography.small, color: colors.textPrimary }} numberOfLines={1}>
              {entry.food_name}
            </Text>
            <Text style={{ ...typography.caption, color: colors.textTertiary }}>
              {formatNumber(Math.round(entry.total_calories))}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});
