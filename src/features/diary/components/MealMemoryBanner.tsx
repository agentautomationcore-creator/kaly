import React, { useRef } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '../../../lib/theme';
import { useMealSuggestions, MealPattern } from '../hooks/useMealPatterns';
import { RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';
import { formatNumber } from '../../../lib/formatNumber';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import type { MealType } from '../../../lib/types';

interface MealMemoryBannerProps {
  mealType: MealType;
  date: string;
}

export function MealMemoryBanner({ mealType, date }: MealMemoryBannerProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: patterns } = useMealSuggestions(mealType);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const submitting = useRef(false);

  if (!patterns || patterns.length === 0) return null;

  const topPattern = patterns[0];

  const handleAdd = async (pattern: MealPattern) => {
    if (!user || submitting.current) return;
    submitting.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { error } = await supabase.from('diary_entries').insert({
        user_id: user.id,
        logged_at: date,
        meal_type: mealType,
        food_name: pattern.food_name,
        food_name_en: pattern.food_name_en,
        food_items: pattern.food_data.food_items,
        quantity_g: pattern.food_data.quantity_g,
        total_calories: pattern.food_data.total_calories,
        total_protein: pattern.food_data.total_protein,
        total_carbs: pattern.food_data.total_carbs,
        total_fat: pattern.food_data.total_fat,
        total_fiber: pattern.food_data.total_fiber,
        entry_method: pattern.food_data.entry_method || 'manual',
        confidence: pattern.food_data.confidence,
      });
      if (error) throw error;
      track('meal_memory_used', { meal_type: mealType, frequency: pattern.frequency });
      qc.invalidateQueries({ queryKey: ['diary', date] });
    } catch (e) {
      Alert.alert(t('common.error'), t('errors.generic'));
      captureException(e, { feature: 'meal_memory' });
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Pressable
      onPress={() => handleAdd(topPattern)}
      accessibilityRole="button"
      accessibilityLabel={t('meal_memory.add_usual', { meal: t(`diary.${mealType}`), food: topPattern.food_name })}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING[2],
        padding: SPACING[3],
        backgroundColor: colors.primarySubtle,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        minHeight: MIN_TOUCH,
      }}
    >
      <Ionicons name="bulb-outline" size={18} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.small, color: colors.primary }} numberOfLines={1}>
          {t('meal_memory.your_usual', { food: topPattern.food_name })}
        </Text>
        <Text style={{ ...typography.caption, color: colors.textTertiary }}>
          {formatNumber(Math.round(topPattern.food_data.total_calories))} {t('common.kcal')} · {t('meal_memory.logged_times', { count: topPattern.frequency })}
        </Text>
      </View>
      <Ionicons name="add-circle" size={24} color={colors.primary} />
    </Pressable>
  );
}
