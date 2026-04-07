import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '../src/lib/theme';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../src/lib/constants';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/stores/authStore';
import { captureException } from '../src/lib/sentry';
import { track } from '../src/lib/analytics';
import i18n from '../src/i18n';
import type { MealType } from '../src/lib/types';

export default function ManualEntryScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{
    mealType?: string;
    name?: string;
    brand?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
    serving_size?: string;
    barcode?: string;
    entry_method?: string;
    community_product_id?: string;
  }>();

  const [name, setName] = useState(params.name || '');
  const [calories, setCalories] = useState(params.calories || '');
  const [protein, setProtein] = useState(params.protein || '');
  const [carbs, setCarbs] = useState(params.carbs || '');
  const [fat, setFat] = useState(params.fat || '');
  const [fiber, setFiber] = useState(params.fiber || '');
  const [servingSize, setServingSize] = useState(params.serving_size || t('manual_entry.default_serving'));
  const [saving, setSaving] = useState(false);

  const mealType = (params.mealType || 'snack') as MealType;
  const entryMethod = (params.entry_method || 'manual') as 'search' | 'manual';
  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const [selectedMeal, setSelectedMeal] = useState<MealType>(mealType);

  const cal = parseInt(calories) || 0;
  const hasWarning = entryMethod === 'search' && cal === 0;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('manual_entry.name_required'));
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('diary_entries').insert({
        user_id: user.id,
        logged_at: today,
        meal_type: selectedMeal,
        food_name: name.trim(),
        food_name_en: name.trim(),
        food_items: [],
        quantity_g: parseInt(servingSize) || null,
        total_calories: cal,
        total_protein: parseFloat(protein) || 0,
        total_carbs: parseFloat(carbs) || 0,
        total_fat: parseFloat(fat) || 0,
        total_fiber: parseFloat(fiber) || 0,
        entry_method: entryMethod,
        edited: false,
      });

      // If this came from a community product, increment its use count
      if (params.community_product_id) {
        supabase.rpc('increment_product_use', { p_product_id: params.community_product_id }).then(() => {});
      } else if (entryMethod === 'manual') {
        // Save new product to community DB for future searches (best-effort)
        supabase.from('user_products').insert({
          created_by: user.id,
          name: name.trim(),
          brand: params.brand || null,
          barcode: params.barcode || null,
          calories_per_100g: cal,
          protein_per_100g: parseFloat(protein) || 0,
          carbs_per_100g: parseFloat(carbs) || 0,
          fat_per_100g: parseFloat(fat) || 0,
          serving_size: servingSize || '100g',
          language: i18n.language,
        }).then(() => {});
      }

      track('meal_logged', { meal_type: selectedMeal, entry_method: entryMethod });
      qc.invalidateQueries({ queryKey: ['diary'] });
      router.dismiss();
    } catch (e) {
      Alert.alert(t('common.error'), t('errors.generic'));
      captureException(e, { feature: 'manual_entry_save' });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    minHeight: MIN_TOUCH,
    fontSize: FONT_SIZE.md,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm }}>
          <Pressable
            onPress={() => router.back()}
            style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, justifyContent: 'center', alignItems: 'center' }}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text, marginStart: SPACING.sm }}>
            {t('manual_entry.title')}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.lg }} keyboardShouldPersistTaps="handled">
          {/* Meal type selector */}
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            {meals.map((m) => (
              <Pressable
                key={m}
                onPress={() => setSelectedMeal(m)}
                accessibilityLabel={t(`diary.${m}`)}
                accessibilityRole="button"
                style={{
                  flex: 1,
                  minHeight: MIN_TOUCH,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.md,
                  backgroundColor: selectedMeal === m ? colors.primaryLight : colors.card,
                  borderWidth: 1.5,
                  borderColor: selectedMeal === m ? colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: FONT_SIZE.xs, fontWeight: '600', color: selectedMeal === m ? colors.primary : colors.textSecondary }}>
                  {t(`diary.${m}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Name */}
          <Card>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, fontWeight: '500', marginBottom: SPACING.xs }}>
              {t('manual_entry.food_name')} *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('manual_entry.food_name_placeholder')}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t('manual_entry.food_name')}
              style={inputStyle}
            />
            {params.brand ? (
              <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, marginTop: SPACING.xs }}>
                {params.brand}
              </Text>
            ) : null}
          </Card>

          {/* Nutrition warning for empty OpenFoodFacts data */}
          {hasWarning && (
            <View style={{ flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, backgroundColor: colors.warningLight, borderRadius: RADIUS.md }}>
              <Ionicons name="warning-outline" size={20} color={colors.warning} />
              <Text style={{ flex: 1, fontSize: FONT_SIZE.sm, color: colors.warning }}>
                {t('manual_entry.missing_nutrition')}
              </Text>
            </View>
          )}

          {/* Calories */}
          <Card>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, fontWeight: '500', marginBottom: SPACING.xs }}>
              {t('common.kcal')}
            </Text>
            <TextInput
              value={calories}
              onChangeText={setCalories}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              accessibilityLabel={t('common.kcal')}
              style={inputStyle}
            />
          </Card>

          {/* Macros */}
          <Card>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, fontWeight: '500', marginBottom: SPACING.sm }}>
              {t('manual_entry.macros')}
            </Text>
            <View style={{ gap: SPACING.sm }}>
              {[
                { label: t('stats.protein'), value: protein, setter: setProtein },
                { label: t('stats.carbs'), value: carbs, setter: setCarbs },
                { label: t('stats.fat'), value: fat, setter: setFat },
                { label: t('stats.fiber'), value: fiber, setter: setFiber },
              ].map(({ label, value, setter }) => (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                  <Text style={{ width: 80, fontSize: FONT_SIZE.sm, color: colors.text }}>{label}</Text>
                  <TextInput
                    value={value}
                    onChangeText={setter}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    accessibilityLabel={`${label} (g)`}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>g</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Serving size */}
          <Card>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, fontWeight: '500', marginBottom: SPACING.xs }}>
              {t('manual_entry.serving_size')}
            </Text>
            <TextInput
              value={servingSize}
              onChangeText={setServingSize}
              placeholder="100g"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t('manual_entry.serving_size')}
              style={inputStyle}
            />
          </Card>

          {/* Save button */}
          <Button
            title={t('scan.add_to', { meal: t(`diary.${selectedMeal}`) })}
            onPress={handleSave}
            loading={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
