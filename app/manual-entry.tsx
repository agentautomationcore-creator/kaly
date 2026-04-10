import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '../src/lib/theme';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { Card } from '../src/components/Card';
import { RADIUS, MIN_TOUCH, SPACING } from '../src/lib/constants';
import { typography } from '../src/lib/typography';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/stores/authStore';
import { captureException } from '../src/lib/sentry';
import { track } from '../src/lib/analytics';
import i18n from '../src/i18n';
import type { MealType } from '../src/lib/types';

function autoSelectMeal(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 17) return 'snack';
  return 'dinner';
}

export default function ManualEntryScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const params = useLocalSearchParams<{
    mealType?: string; name?: string; brand?: string; calories?: string;
    protein?: string; carbs?: string; fat?: string; fiber?: string;
    serving_size?: string; barcode?: string; entry_method?: string; community_product_id?: string;
  }>();

  const [name, setName] = useState(params.name || '');
  const [calories, setCalories] = useState(params.calories || '');
  const [protein, setProtein] = useState(params.protein || '');
  const [carbs, setCarbs] = useState(params.carbs || '');
  const [fat, setFat] = useState(params.fat || '');
  const [saving, setSaving] = useState(false);

  const filterNumeric = (text: string) => {
    let cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    return cleaned;
  };

  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const [selectedMeal, setSelectedMeal] = useState<MealType>((params.mealType as MealType) || autoSelectMeal());

  const cal = parseInt(calories) || 0;
  const canSave = name.trim().length >= 2;

  const handleSave = async () => {
    if (!canSave) { Alert.alert(t('common.error'), t('manual_entry.name_too_short')); return; }
    if (!user) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('diary_entries').insert({
        user_id: user.id, logged_at: today, meal_type: selectedMeal,
        food_name: name.trim(), food_name_en: name.trim(), food_items: [],
        quantity_g: null, total_calories: Math.max(0, cal),
        total_protein: Math.max(0, parseFloat(protein) || 0),
        total_carbs: Math.max(0, parseFloat(carbs) || 0),
        total_fat: Math.max(0, parseFloat(fat) || 0),
        total_fiber: 0, entry_method: params.entry_method || 'manual', edited: false,
      });
      try {
        if (params.community_product_id) {
          await supabase.rpc('increment_product_use', { p_product_id: params.community_product_id });
        } else if ((params.entry_method || 'manual') === 'manual') {
          await supabase.from('user_products').insert({
            created_by: user.id, name: name.trim(), brand: params.brand || null,
            barcode: params.barcode || null, calories_per_100g: cal,
            protein_per_100g: parseFloat(protein) || 0, carbs_per_100g: parseFloat(carbs) || 0,
            fat_per_100g: parseFloat(fat) || 0, serving_size: '100g', language: i18n.language,
          });
        }
      } catch (e) { captureException(e, { feature: 'manual_entry_product_save' }); }
      track('meal_logged', { meal_type: selectedMeal, entry_method: params.entry_method || 'manual' });
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
    minHeight: 52,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: SPACING[4],
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header: Cancel (left) + Save (right) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING[4], paddingVertical: SPACING[2] }}>
          <Pressable onPress={() => router.back()} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ ...typography.h3, color: colors.textPrimary }}>{t('manual_entry.title')}</Text>
          <Pressable onPress={handleSave} disabled={!canSave || saving} style={{ minHeight: MIN_TOUCH, justifyContent: 'center', opacity: canSave ? 1 : 0.4 }} accessibilityRole="button" accessibilityLabel={t('common.save')}>
            <Text style={{ ...typography.bodyMedium, color: colors.primary }}>{t('common.save')} \u2713</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: SPACING[4], gap: SPACING[4] }} keyboardShouldPersistTaps="handled">
          {/* Meal selector — 4 chips */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2] }}>
            {meals.map((m) => (
              <Chip key={m} label={t(`diary.${m}`)} selected={selectedMeal === m} onToggle={() => setSelectedMeal(m)} />
            ))}
          </View>

          {/* Food name */}
          <View>
            <Text style={{ ...typography.smallMedium, color: colors.textSecondary, marginBottom: SPACING[1] }}>
              {t('manual_entry.food_name')} *
            </Text>
            <TextInput value={name} onChangeText={setName} placeholder={t('manual_entry.food_name_placeholder')} placeholderTextColor={colors.textTertiary} accessibilityLabel={t('manual_entry.food_name')} style={inputStyle} />
          </View>

          {/* Calories */}
          <View>
            <Text style={{ ...typography.smallMedium, color: colors.textSecondary, marginBottom: SPACING[1] }}>
              {t('common.kcal')} *
            </Text>
            <TextInput value={calories} onChangeText={(v) => setCalories(filterNumeric(v))} placeholder="0" placeholderTextColor={colors.textTertiary} keyboardType="numeric" accessibilityLabel={t('common.kcal')} style={inputStyle} />
          </View>

          {/* Macros — 3-column */}
          <View>
            <Text style={{ ...typography.smallMedium, color: colors.textSecondary, marginBottom: SPACING[2] }}>
              {t('manual_entry.macros')} ({t('manual_entry.optional')})
            </Text>
            <View style={{ flexDirection: 'row', gap: SPACING[2] }}>
              {[
                { label: 'P', value: protein, setter: setProtein, color: colors.protein },
                { label: 'C', value: carbs, setter: setCarbs, color: colors.carbs },
                { label: 'F', value: fat, setter: setFat, color: colors.fat },
              ].map(({ label, value, setter, color }) => (
                <View key={label} style={{ flex: 1 }}>
                  <Text style={{ ...typography.caption, color, marginBottom: 2 }}>{label} (g)</Text>
                  <TextInput
                    value={value}
                    onChangeText={(v) => setter(filterNumeric(v))}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Save button — full width at bottom */}
        <View style={{ padding: SPACING[4] }}>
          <Button
            title={`${t('scan.add_to', { meal: t(`diary.${selectedMeal}`) })}`}
            onPress={handleSave}
            loading={saving}
            disabled={!canSave}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
