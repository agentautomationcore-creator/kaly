import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { ProgressBar } from '../../../components/ProgressBar';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';
import { formatNumber } from '../../../lib/formatNumber';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import { useHealthKit } from '../../../hooks/useHealthKit';
import { useQueryClient } from '@tanstack/react-query';
import type { BarcodeProduct } from '../hooks/useBarcodeLookup';
import type { MealType } from '../../../lib/types';

interface BarcodeResultProps {
  product: BarcodeProduct;
  onDone: () => void;
  onScanAgain: () => void;
}

const PORTION_PRESETS = [50, 100, 150, 200, 250];

export function BarcodeResult({ product, onDone, onScanAgain }: BarcodeResultProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [portionG, setPortionG] = useState(100);
  const [customPortion, setCustomPortion] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [saving, setSaving] = useState(false);
  const [productName, setProductName] = useState(product.name);
  const isManual = product.source === 'manual';
  const { saveCalories } = useHealthKit();

  const ratio = portionG / 100;
  const cal = Math.round(product.calories100g * ratio);
  const protein = Math.round(product.protein100g * ratio * 10) / 10;
  const fat = Math.round(product.fat100g * ratio * 10) / 10;
  const carbs = Math.round(product.carbs100g * ratio * 10) / 10;

  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const handleSave = async () => {
    if (!user) return;
    if (!(productName || product.name).trim()) {
      Alert.alert(t('common.error'), t('barcode.name_required'));
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('diary_entries').insert({
        user_id: user.id,
        logged_at: today,
        meal_type: mealType,
        food_name: productName || product.name,
        food_name_en: productName || product.name,
        food_items: [{
          name: product.name,
          name_en: product.name,
          g: portionG,
          calories: cal,
          protein_g: protein,
          fat_g: fat,
          carbs_g: carbs,
          fiber_g: 0,
          confidence: 1,
          hidden: false,
        }],
        quantity_g: portionG,
        total_calories: cal,
        total_protein: protein,
        total_carbs: carbs,
        total_fat: fat,
        total_fiber: 0,
        confidence: 1,
        entry_method: 'barcode',
      });

      track('meal_logged', { meal_type: mealType, entry_method: 'barcode' });
      try { await saveCalories(cal); } catch (e) { if (__DEV__) console.log('[HealthKit] Save calories failed:', e); }
      qc.invalidateQueries({ queryKey: ['diary'] });
      onDone();
    } catch (e) {
      Alert.alert(t('common.error'), t('errors.generic'));
      captureException(e, { feature: 'barcode_save' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg }}>
          <Pressable onPress={onScanAgain} style={{ padding: SPACING.sm, minHeight: MIN_TOUCH, minWidth: 44, justifyContent: 'center', alignItems: 'center' }} accessibilityRole="button" accessibilityLabel={t('common.close')}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text }}>{t('barcode.result_title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Product info */}
        <Card style={{ marginBottom: SPACING.lg }}>
          {isManual ? (
            <TextInput
              value={productName}
              onChangeText={setProductName}
              placeholder={t('barcode.product_name')}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t('barcode.product_name')}
              style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text, marginBottom: SPACING.sm, borderBottomWidth: 1, borderColor: colors.primary, paddingBottom: SPACING.xs }}
            />
          ) : (
            <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text, marginBottom: SPACING.sm }} numberOfLines={2} ellipsizeMode="tail">
              {product.name}
            </Text>
          )}

          {/* Big calorie number */}
          <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
            <Text style={{ fontSize: FONT_SIZE.display, fontWeight: '800', color: colors.primary }}>{formatNumber(cal)}</Text>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{t('common.kcal')}</Text>
          </View>

          {/* Macros */}
          <View style={{ gap: SPACING.sm }}>
            <ProgressBar label={t('stats.protein')} value={protein} max={protein + carbs + fat || 1} color={colors.proteinColor} showValue />
            <ProgressBar label={t('stats.carbs')} value={carbs} max={protein + carbs + fat || 1} color={colors.carbsColor} showValue />
            <ProgressBar label={t('stats.fat')} value={fat} max={protein + carbs + fat || 1} color={colors.fatColor} showValue />
          </View>
        </Card>

        {/* Portion selector */}
        <Card style={{ marginBottom: SPACING.lg }}>
          <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: SPACING.md }}>
            {t('barcode.portion')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md }}>
            {PORTION_PRESETS.map((g) => (
              <Pressable
                key={g}
                onPress={() => { setPortionG(g); setCustomPortion(''); }}
                accessibilityRole="button"
                accessibilityLabel={`${g} ${t('units.g')}`}
                style={{
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: 10,
                  borderRadius: RADIUS.full,
                  backgroundColor: portionG === g && !customPortion ? colors.primaryLight : colors.surface,
                  borderWidth: 1.5,
                  borderColor: portionG === g && !customPortion ? colors.primary : 'transparent',
                  minHeight: MIN_TOUCH,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontWeight: '500', color: portionG === g && !customPortion ? colors.primary : colors.text, fontSize: FONT_SIZE.sm }}>
                  {g} {t('units.g')}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Custom portion input */}
          <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' }}>
            <TextInput
              value={customPortion}
              onChangeText={(v) => {
                setCustomPortion(v);
                const n = parseInt(v, 10);
                if (n > 0) setPortionG(n);
              }}
              placeholder={t('barcode.custom_portion')}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t('barcode.custom_portion')}
              keyboardType="numeric"
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                fontSize: FONT_SIZE.sm,
                color: colors.text,
              }}
            />
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>g</Text>
          </View>
        </Card>

        {/* Meal type */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg }}>
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

        {/* Save */}
        <Button
          title={t('scan.add_to', { meal: t(`diary.${mealType}`) })}
          onPress={handleSave}
          loading={saving}
        />

        {/* Scan again */}
        <Pressable
          onPress={onScanAgain}
          style={{ alignItems: 'center', marginTop: SPACING.lg, minHeight: MIN_TOUCH, justifyContent: 'center' }}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, fontWeight: '500' }}>
            {t('barcode.scan_again')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
