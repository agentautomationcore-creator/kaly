import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { useScanStore } from '../store/scanStore';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { ProgressBar } from '../../../components/ProgressBar';
import { IngredientList } from './IngredientList';
import { PortionSlider } from './PortionSlider';
import { FONT_SIZE, RADIUS, MIN_TOUCH } from '../../../lib/constants';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { useHealthKit } from '../../../hooks/useHealthKit';
import { useAddEntry } from '../../diary/hooks/useDiary';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import { formatNumber } from '../../../lib/formatNumber';
import type { MealType } from '../../../lib/types';

export function NutritionResultCard() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { result, portionMultiplier, reset, isEdited } = useScanStore();
  const [mealType, setMealType] = useState<MealType>('lunch');
  const user = useAuthStore((s) => s.user);
  const { saveCalories } = useHealthKit();
  const addEntry = useAddEntry();

  if (!result) return null;

  const m = portionMultiplier;
  const cal = Math.round(result.total.calories * m);
  const protein = Math.round(result.total.protein_g * m * 10) / 10;
  const carbs = Math.round(result.total.carbs_g * m * 10) / 10;
  const fat = Math.round(result.total.fat_g * m * 10) / 10;
  const fiber = Math.round(result.total.fiber_g * m * 10) / 10;

  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const handleSave = () => {
    if (!user) return;

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
        entry_method: 'photo' as const,
        edited: isEdited,
      },
      {
        onSuccess: () => {
          track('meal_logged', { meal_type: mealType, entry_method: 'photo' });
          saveCalories(cal).catch((e) => captureException(e, { feature: 'healthkit_save_calories' }));
          reset();
          router.replace({ pathname: '/(tabs)/diary', params: { saved: '1' } });
        },
        onError: (e) => {
          Alert.alert(t('common.error'), t('errors.generic'));
          captureException(e, { feature: 'save_meal' });
        },
      },
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Pressable onPress={reset} style={{ padding: 8, minHeight: MIN_TOUCH, minWidth: 44, justifyContent: 'center', alignItems: 'center' }} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text }}>{t('scan.result_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main card */}
      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
          {result.dish_name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>
            {formatNumber(Math.round(result.total_portion_g * m))} {t('units.g')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>{t('scan.confidence')}:</Text>
            <Text style={{ fontSize: FONT_SIZE.xs, fontWeight: '600', color: result.confidence > 0.8 ? colors.success : colors.warning }}>
              {Math.round(result.confidence * 100)}%
            </Text>
          </View>
        </View>

        {/* Big calorie number */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: FONT_SIZE.display, fontWeight: '800', color: colors.primary }}>{formatNumber(cal)}</Text>
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{t('common.kcal')}</Text>
        </View>

        {/* Macro bars */}
        <View style={{ gap: 8 }}>
          <ProgressBar label={t('stats.protein')} value={protein} max={protein + carbs + fat} color={colors.proteinColor} showValue />
          <ProgressBar label={t('stats.carbs')} value={carbs} max={protein + carbs + fat} color={colors.carbsColor} showValue />
          <ProgressBar label={t('stats.fat')} value={fat} max={protein + carbs + fat} color={colors.fatColor} showValue />
          {fiber > 0 && <ProgressBar label={t('stats.fiber')} value={fiber} max={30} color={colors.fiberColor} showValue />}
        </View>
      </Card>

      {/* Portion slider */}
      <Card style={{ marginBottom: 16 }}>
        <PortionSlider />
      </Card>

      {/* Ingredients */}
      <Card style={{ marginBottom: 16 }}>
        {result.items.length === 0 ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.warning, textAlign: 'center' }}>
              {t('scan.no_ingredients')}
            </Text>
          </View>
        ) : (
          <IngredientList items={result.items} multiplier={m} />
        )}
      </Card>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Card style={{ marginBottom: 16, backgroundColor: colors.warningLight }}>
          {result.warnings.map((w, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: i < result.warnings.length - 1 ? 8 : 0 }}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={{ fontSize: FONT_SIZE.sm, color: colors.warning, flex: 1 }}>{w}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Meal type selector */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {meals.map((m) => (
          <Pressable
            key={m}
            onPress={() => setMealType(m)}
            accessibilityLabel={t(`diary.${m}`)}
            accessibilityRole="button"
            style={{
              flex: 1,
              minHeight: MIN_TOUCH,
              paddingVertical: 10,
              borderRadius: RADIUS.md,
              backgroundColor: mealType === m ? colors.primaryLight : colors.card,
              borderWidth: 1.5,
              borderColor: mealType === m ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: FONT_SIZE.xs, fontWeight: '600', color: mealType === m ? colors.primary : colors.textSecondary }}>
              {t(`diary.${m}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Save button */}
      <Button
        title={t('scan.add_to', { meal: t(`diary.${mealType}`) })}
        onPress={handleSave}
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
        style={{ alignItems: 'center', marginTop: 16, minHeight: MIN_TOUCH, justifyContent: 'center' }}
      >
        <Text style={{ fontSize: FONT_SIZE.sm, color: colors.danger, fontWeight: '500' }}>
          {t('scan.wrong_result')}
        </Text>
      </Pressable>

      <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textAlign: 'center', marginTop: 16 }}>
        {t('scan.disclaimer')}
      </Text>
    </ScrollView>
  );
}
