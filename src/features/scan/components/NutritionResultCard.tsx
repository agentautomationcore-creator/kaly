import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { backIcon } from '../../../lib/rtl';
import { useColors } from '../../../lib/theme';
import { useScanStore } from '../store/scanStore';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { SaveButton } from '../../../components/SaveButton';
import { Badge } from '../../../components/Badge';
import { Chip } from '../../../components/Chip';
import { ProgressBar } from '../../../components/ProgressBar';
import { IngredientList } from './IngredientList';
import { PortionSlider } from './PortionSlider';
import { RADIUS, MIN_TOUCH, SPACING, SHADOW } from '../../../lib/constants';
import { typography } from '../../../lib/typography';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { useHealthKit } from '../../../hooks/useHealthKit';
import { useAddEntry } from '../../diary/hooks/useDiary';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import { formatNumber } from '../../../lib/formatNumber';
import type { MealType } from '../../../lib/types';

function autoSelectMeal(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 17) return 'snack';
  return 'dinner';
}

interface NutritionResultCardProps {
  entryMethod?: 'photo' | 'text';
}

export function NutritionResultCard({ entryMethod = 'photo' }: NutritionResultCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { result, portionMultiplier, reset, isEdited } = useScanStore();
  const [mealType, setMealType] = useState<MealType>(autoSelectMeal);
  const user = useAuthStore((s) => s.user);
  const { saveCalories } = useHealthKit();
  const addEntry = useAddEntry();
  const saving = useRef(false);

  if (!result) return null;

  const m = portionMultiplier;
  const cal = Math.round(result.total.calories * m);
  const protein = Math.round(result.total.protein_g * m * 10) / 10;
  const carbs = Math.round(result.total.carbs_g * m * 10) / 10;
  const fat = Math.round(result.total.fat_g * m * 10) / 10;
  const fiber = Math.round(result.total.fiber_g * m * 10) / 10;
  const totalMacros = protein + carbs + fat || 1;

  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  // Confidence color: green >= 80%, yellow >= 50%, red < 50%
  const confidenceColor = result.confidence >= 0.8
    ? colors.success
    : result.confidence >= 0.5
      ? colors.warning
      : colors.error;

  const handleSave = () => {
    if (!user || saving.current) return;
    saving.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    addEntry.mutate(
      {
        user_id: user.id,
        logged_at: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        food_name: result.dish_name,
        food_name_en: result.dish_name_en,
        food_items: result.items.map((item) => ({
          ...item,
          g: Math.round(item.g * m),
          calories: Math.round(item.calories * m),
          protein_g: Math.round(item.protein_g * m * 10) / 10,
          fat_g: Math.round(item.fat_g * m * 10) / 10,
          carbs_g: Math.round(item.carbs_g * m * 10) / 10,
          fiber_g: Math.round(item.fiber_g * m * 10) / 10,
        })),
        quantity_g: Math.round(result.total_portion_g * m),
        total_calories: cal,
        total_protein: protein,
        total_carbs: carbs,
        total_fat: fat,
        total_fiber: fiber,
        confidence: result.confidence,
        entry_method: entryMethod,
        edited: isEdited,
      },
      {
        onSuccess: () => {
          saving.current = false;
          track('meal_logged', { meal_type: mealType, entry_method: entryMethod });
          saveCalories(cal).catch((e) => captureException(e, { feature: 'healthkit_save_calories' }));
          reset();
          router.replace({ pathname: '/(tabs)/diary', params: { saved: '1' } });
        },
        onError: (e) => {
          saving.current = false;
          Alert.alert(t('common.error'), t('errors.generic'));
          captureException(e, { feature: 'save_meal' });
        },
      },
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: SPACING[4], paddingBottom: 100 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[4] }}>
        <Pressable onPress={reset} style={{ padding: 8, minHeight: MIN_TOUCH, minWidth: 44, justifyContent: 'center', alignItems: 'center' }} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <Ionicons name={backIcon()} size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ ...typography.h2, color: colors.textPrimary }}>{t('scan.result_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Food info + confidence score */}
      <View style={{ marginBottom: SPACING[4] }}>
        <Text style={{ ...typography.h2, color: colors.textPrimary, marginBottom: SPACING[2] }}>
          {result.dish_name}
        </Text>

        {/* Confidence score bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2], marginBottom: SPACING[1] }}>
          <Badge variant="ai" label={entryMethod === 'text' ? 'AI' : 'AI \uD83D\uDCF7'} />
          <Text style={{ ...typography.smallMedium, color: confidenceColor, fontVariant: ['tabular-nums'] }}>
            {Math.round(result.confidence * 100)}%
          </Text>
          <Text style={{ ...typography.caption, color: colors.textTertiary }}>
            {t('scan.confidence')}
          </Text>
        </View>
        <View style={{ height: 6, borderRadius: RADIUS.full, backgroundColor: colors.border, overflow: 'hidden' }}>
          <View
            style={{
              width: `${Math.min(100, Math.round(result.confidence * 100))}%`,
              height: '100%',
              borderRadius: RADIUS.full,
              backgroundColor: confidenceColor,
            }}
          />
        </View>
        <Text style={{ ...typography.caption, color: colors.textTertiary, marginTop: SPACING[1] }}>
          {result.confidence >= 0.8
            ? t('confidence.high')
            : result.confidence >= 0.5
              ? t('confidence.medium')
              : t('confidence.low')}
        </Text>
      </View>

      {/* Nutrition hero card */}
      <Card style={{ marginBottom: SPACING[4], alignItems: 'center', ...SHADOW.md }}>
        <Text style={{ ...typography.display, color: colors.primary }}>{formatNumber(cal)}</Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: SPACING[4] }}>{t('common.calories')}</Text>

        {/* 3-column macros */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
          {[
            { label: t('stats.protein'), value: protein, color: colors.protein, pct: Math.round((protein / totalMacros) * 100) },
            { label: t('stats.carbs'), value: carbs, color: colors.carbs, pct: Math.round((carbs / totalMacros) * 100) },
            { label: t('stats.fat'), value: fat, color: colors.fat, pct: Math.round((fat / totalMacros) * 100) },
          ].map((macro) => (
            <View key={macro.label} style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ ...typography.h2, color: macro.color }}>{formatNumber(Math.round(macro.value))}g</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>{macro.label}</Text>
              <View style={{ width: '60%', height: 4, borderRadius: RADIUS.full, backgroundColor: colors.border, marginTop: 6 }}>
                <View style={{ width: `${Math.min(100, macro.pct)}%`, height: '100%', borderRadius: RADIUS.full, backgroundColor: macro.color }} />
              </View>
              <Text style={{ ...typography.caption, color: colors.textTertiary, marginTop: 2 }}>{macro.pct}%</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Portion slider */}
      <Card style={{ marginBottom: SPACING[4] }}>
        <PortionSlider />
      </Card>

      {/* Ingredients */}
      <Card style={{ marginBottom: SPACING[4] }}>
        {result.items.length === 0 ? (
          <View style={{ padding: SPACING[4], alignItems: 'center' }}>
            <Text style={{ ...typography.small, color: colors.warning, textAlign: 'center' }}>
              {t('scan.no_ingredients')}
            </Text>
          </View>
        ) : (
          <IngredientList items={result.items} multiplier={m} />
        )}
      </Card>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Card style={{ marginBottom: SPACING[4], backgroundColor: colors.errorSubtle }}>
          {result.warnings.map((w, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: i < result.warnings.length - 1 ? 8 : 0 }}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={{ ...typography.small, color: colors.warning, flex: 1 }}>{w}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Meal selector — 4 chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING[4] }}>
        {meals.map((ml) => (
          <Chip
            key={ml}
            label={t(`diary.${ml}`)}
            selected={mealType === ml}
            onToggle={() => setMealType(ml)}
          />
        ))}
      </View>

      {/* Save button with checkmark animation */}
      <SaveButton
        title={t('scan.save_to_diary')}
        onSave={handleSave}
        loading={addEntry.isPending}
      />

      {/* Wrong result — feedback */}
      <Pressable
        onPress={() => {
          const options = [
            t('feedback.wrong_food'),
            t('feedback.wrong_portion'),
            t('feedback.wrong_calories'),
            t('feedback.missing_ingredient'),
            t('feedback.other'),
          ];
          Alert.alert(t('feedback.title'), undefined, [
            ...options.map((label) => ({
              text: label,
              onPress: async () => {
                if (!user) return;
                await supabase.from('ai_feedback').insert({
                  user_id: user.id,
                  food_name: result.dish_name,
                  feedback_type: label,
                  original_result: result,
                });
                track('feedback_submitted', { feedback_type: label });
                Alert.alert(t('feedback.thanks'));
              },
            })),
            { text: t('common.cancel'), style: 'cancel' as const },
          ]);
        }}
        accessibilityRole="button"
        accessibilityLabel={t('scan.wrong_result')}
        style={{ alignItems: 'center', marginTop: SPACING[4], minHeight: MIN_TOUCH, justifyContent: 'center' }}
      >
        <Text style={{ ...typography.small, color: colors.error, fontWeight: '500' }}>
          {t('scan.wrong_result')}
        </Text>
      </Pressable>

      <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: SPACING[4] }}>
        {t('scan.disclaimer')}
      </Text>
    </ScrollView>
  );
}
