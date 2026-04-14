import React, { useState, useEffect, useRef } from 'react';
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
import { useSettingsStore } from '../../../stores/settingsStore';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import { formatNumber } from '../../../lib/formatNumber';
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
  const { suggestions, isLoading, error, hasQueried, suggest, clear } = useMealSuggestions();
  const aiConsentGiven = useSettingsStore((s) => s.aiConsentGiven);
  const [errorCooldown, setErrorCooldown] = useState(false);

  useEffect(() => {
    if (error) {
      setErrorCooldown(true);
      const timer = setTimeout(() => setErrorCooldown(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

  const addingRef = useRef(false);

  const handleAddToDiary = async (s: MealSuggestion) => {
    if (!user) return;
    if (addingRef.current) return;
    addingRef.current = true;
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
    } finally {
      addingRef.current = false;
    }
  };

  // No AI consent — don't show suggestions at all
  if (!aiConsentGiven) return null;

  // Not yet triggered — show suggest button
  if (suggestions.length === 0 && !isLoading && !error) {
    return (
      <Pressable
        onPress={handleSuggest}
        disabled={isLoading || errorCooldown}
        style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, minHeight: MIN_TOUCH, opacity: errorCooldown ? 0.5 : 1 }}
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

  // Error with cooldown
  if (error) {
    return (
      <View style={{ paddingVertical: SPACING.sm }}>
        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.danger }}>
          {error === 'RATE_LIMIT' ? t('scan.scan_limit', { limit: 10 }) : t('errors.generic')}
        </Text>
        <Pressable
          onPress={handleSuggest}
          disabled={errorCooldown}
          style={{ marginTop: SPACING.xs, minHeight: MIN_TOUCH, opacity: errorCooldown ? 0.5 : 1 }}
          accessibilityRole="button"
        >
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
      {suggestions.length === 0 && hasQueried && !isLoading && (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: SPACING.lg, fontSize: FONT_SIZE.sm }}>
          {t('diary.suggest_no_results')}
        </Text>
      )}
      {suggestions.map((s, i) => (
        <Pressable
          key={`${s.name}-${i}`}
          onPress={() => handleAddToDiary(s)}
          accessibilityRole="button"
          accessibilityLabel={`${s.name} ${s.calories} ${t('common.kcal')}`}
          style={{
            padding: SPACING.md,
            minHeight: MIN_TOUCH,
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
              {formatNumber(s.calories)} {t('common.kcal')}
            </Text>
          </View>
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }} numberOfLines={2}>
            {s.description}
          </Text>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <View style={{ backgroundColor: colors.proteinColor + '20', paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: RADIUS.sm }}>
              <Text style={{ color: colors.text, fontSize: FONT_SIZE.xs }}>{t('common.protein_short')}: {formatNumber(s.protein)}{t('common.g')}</Text>
            </View>
            <View style={{ backgroundColor: colors.carbsColor + '20', paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: RADIUS.sm }}>
              <Text style={{ color: colors.text, fontSize: FONT_SIZE.xs }}>{t('common.carbs_short')}: {formatNumber(s.carbs)}{t('common.g')}</Text>
            </View>
            <View style={{ backgroundColor: colors.fatColor + '20', paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: RADIUS.sm }}>
              <Text style={{ color: colors.text, fontSize: FONT_SIZE.xs }}>{t('common.fat_short')}: {formatNumber(s.fat)}{t('common.g')}</Text>
            </View>
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
