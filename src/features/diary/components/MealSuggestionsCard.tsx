import React from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '../../../lib/theme';
import { Card } from '../../../components/Card';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';
import { useMealSuggestions, MealSuggestion } from '../../../hooks/useMealSuggestions';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import type { MealType } from '../../../lib/types';

interface MealSuggestionsCardProps {
  mealType: MealType;
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
  dietType?: string;
  allergies?: string[];
  date: string;
}

export function MealSuggestionsCard({
  mealType,
  remainingCalories,
  remainingProtein,
  remainingCarbs,
  remainingFat,
  dietType,
  allergies,
  date,
}: MealSuggestionsCardProps) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { suggestions, isLoading, error, suggest, clear } = useMealSuggestions();

  const handleSuggest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track('suggest_meal_tapped', { meal_type: mealType });
    suggest({
      remaining_calories: remainingCalories,
      remaining_protein: remainingProtein,
      remaining_carbs: remainingCarbs,
      remaining_fat: remainingFat,
      meal_type: mealType,
      dietary_preferences: dietType || undefined,
      allergies: allergies?.join(', ') || undefined,
      language: i18n.language,
    });
  };

  const handleAddToDiary = async (s: MealSuggestion) => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await supabase.from('diary_entries').insert({
        user_id: user.id,
        logged_at: date,
        meal_type: mealType,
        food_name: s.name,
        food_name_en: s.name,
        food_items: s.ingredients.map((ing) => ({
          name: ing,
          name_en: ing,
          g: 0,
          calories: 0,
          protein_g: 0,
          fat_g: 0,
          carbs_g: 0,
          fiber_g: 0,
          confidence: 0.8,
          hidden: false,
        })),
        total_calories: s.calories,
        total_protein: s.protein,
        total_carbs: s.carbs,
        total_fat: s.fat,
        total_fiber: 0,
        entry_method: 'manual',
        edited: false,
      });

      track('suggestion_added', { meal_type: mealType, name: s.name });
      qc.invalidateQueries({ queryKey: ['diary', date] });
      clear();
    } catch (e) {
      Alert.alert(t('common.error'), t('errors.generic'));
      captureException(e, { feature: 'add_suggestion' });
    }
  };

  // Not yet triggered — show suggest button
  if (suggestions.length === 0 && !isLoading && !error) {
    return (
      <Pressable
        onPress={handleSuggest}
        style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, minHeight: MIN_TOUCH }}
        accessibilityRole="button"
        accessibilityLabel={t('diary.suggest_meal')}
      >
        <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
        <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary }}>{t('diary.suggest_meal')}</Text>
      </Pressable>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <View style={{ paddingVertical: SPACING.lg, alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, marginTop: SPACING.sm }}>
          {t('diary.suggestions_title')}...
        </Text>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={{ paddingVertical: SPACING.sm }}>
        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.danger }}>
          {error === 'RATE_LIMIT' ? t('scan.scan_limit', { limit: 10 }) : t('errors.generic')}
        </Text>
        <Pressable onPress={handleSuggest} style={{ marginTop: SPACING.xs }} accessibilityRole="button">
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.primary }}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  // Suggestions
  return (
    <View style={{ gap: SPACING.sm, paddingTop: SPACING.sm }}>
      <Text style={{ fontSize: FONT_SIZE.xs, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
        {t('diary.suggestions_title')}
      </Text>
      {suggestions.map((s, i) => (
        <Pressable
          key={`${s.name}-${i}`}
          onPress={() => handleAddToDiary(s)}
          accessibilityRole="button"
          accessibilityLabel={`${s.name} ${s.calories} kcal`}
          style={{
            padding: SPACING.md,
            backgroundColor: colors.surface,
            borderRadius: RADIUS.md,
            gap: SPACING.xs,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, flex: 1 }} numberOfLines={1}>
              {s.name}
            </Text>
            <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '700', color: colors.primary }}>
              {s.calories} kcal
            </Text>
          </View>
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }} numberOfLines={2}>
            {s.description}
          </Text>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.proteinColor }}>P: {s.protein}g</Text>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.carbsColor }}>C: {s.carbs}g</Text>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.fatColor }}>F: {s.fat}g</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs }}>
            <Ionicons name="add-circle-outline" size={14} color={colors.primary} />
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.primary }}>{t('diary.add_suggestion')}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
