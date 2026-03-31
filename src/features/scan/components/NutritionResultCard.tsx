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
import { FONT_SIZE, RADIUS } from '../../../lib/constants';
import { supabase } from '../../../lib/supabase';
import type { MealType } from '../../../lib/types';

export function NutritionResultCard() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { result, portionMultiplier, reset } = useScanStore();
  const [saving, setSaving] = useState(false);
  const [mealType, setMealType] = useState<MealType>('lunch');

  if (!result) return null;

  const m = portionMultiplier;
  const cal = Math.round(result.total.calories * m);
  const protein = +(result.total.protein_g * m).toFixed(1);
  const carbs = +(result.total.carbs_g * m).toFixed(1);
  const fat = +(result.total.fat_g * m).toFixed(1);
  const fiber = +(result.total.fiber_g * m).toFixed(1);

  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('diary_entries').insert({
        user_id: user.id,
        meal_type: mealType,
        food_name: result.dish_name,
        food_name_en: result.dish_name_en,
        food_items: result.items.map((item) => ({
          ...item,
          g: Math.round(item.g * m),
          calories: Math.round(item.calories * m),
          protein_g: +(item.protein_g * m).toFixed(1),
          fat_g: +(item.fat_g * m).toFixed(1),
          carbs_g: +(item.carbs_g * m).toFixed(1),
          fiber_g: +(item.fiber_g * m).toFixed(1),
        })),
        quantity_g: Math.round(result.total_portion_g * m),
        total_calories: cal,
        total_protein: protein,
        total_carbs: carbs,
        total_fat: fat,
        total_fiber: fiber,
        confidence: result.confidence,
        entry_method: 'photo',
      });

      reset();
      router.replace('/(tabs)/diary');
    } catch (e) {
      Alert.alert(t('common.error'), t('errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Pressable onPress={reset} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{t('scan.result_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main card */}
      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
          {result.dish_name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>
            {Math.round(result.total_portion_g * m)}g
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
          <Text style={{ fontSize: 48, fontWeight: '800', color: colors.primary }}>{cal}</Text>
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
        <IngredientList items={result.items} multiplier={m} />
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
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: RADIUS.md,
              backgroundColor: mealType === m ? colors.primaryLight : colors.card,
              borderWidth: 1.5,
              borderColor: mealType === m ? colors.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: mealType === m ? colors.primary : colors.textSecondary }}>
              {t(`diary.${m}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Save button */}
      <Button
        title={t('scan.add_to', { meal: t(`diary.${mealType}`) })}
        onPress={handleSave}
        loading={saving}
      />

      {/* Wrong result */}
      <Pressable onPress={() => {/* TODO: open feedback modal */}} style={{ alignItems: 'center', marginTop: 16 }}>
        <Text style={{ fontSize: FONT_SIZE.sm, color: colors.danger, fontWeight: '500' }}>
          {t('scan.wrong_result')}
        </Text>
      </Pressable>

      <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 16 }}>
        {t('scan.disclaimer')}
      </Text>
    </ScrollView>
  );
}
