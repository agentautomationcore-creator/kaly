import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { useWeightLog, useLogWeight } from '../hooks/useWeightLog';
import { useSettingsStore } from '../../../stores/settingsStore';
import { kgToLbs, lbsToKg } from '../../../lib/nutrition';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { FONT_SIZE, RADIUS, MIN_TOUCH } from '../../../lib/constants';
import { useHealthKit } from '../../../hooks/useHealthKit';

export function WeightLog() {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: entries } = useWeightLog();
  const { mutate: logWeight, isPending } = useLogWeight();
  const units = useSettingsStore((s) => s.units);
  const isImperial = units === 'imperial';
  const [weight, setWeight] = useState('');
  const [showInput, setShowInput] = useState(false);
  const { saveWeight: saveWeightToHealth } = useHealthKit();

  const displayWeight = (kg: number) => isImperial ? kgToLbs(kg) : kg;
  const unitLabel = isImperial ? t('units.lbs') : t('units.kg');

  const handleLog = () => {
    const w = parseFloat(weight);
    if (w > 0) {
      // B7: Convert imperial input to kg for storage
      const weightKg = isImperial ? lbsToKg(w) : w;
      logWeight(weightKg, { onSuccess: () => { setWeight(''); setShowInput(false); saveWeightToHealth(weightKg).catch(() => {}); } });
    }
  };

  const recent = (entries || []).slice(0, 7);
  const minW = recent.length > 0 ? Math.min(...recent.map((e) => e.weight_kg)) : 0;
  const maxW = recent.length > 0 ? Math.max(...recent.map((e) => e.weight_kg)) : 0;
  const range = maxW - minW || 1;

  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
          {t('profile.weight_log')}
        </Text>
        <Pressable onPress={() => setShowInput(!showInput)} style={{ minHeight: MIN_TOUCH, minWidth: 44, justifyContent: 'center', alignItems: 'center' }} accessibilityRole="button" accessibilityLabel={showInput ? t('common.close') : t('diary.add_food')}>
          <Ionicons name={showInput ? 'close' : 'add-circle'} size={24} color={colors.primary} />
        </Pressable>
      </View>

      {showInput && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder={unitLabel}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            accessibilityLabel={t('stats.weight_input')}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: RADIUS.md,
              padding: 12,
              fontSize: FONT_SIZE.md,
              color: colors.text,
            }}
          />
          <Button title={t('common.save')} onPress={handleLog} loading={isPending} style={{ paddingHorizontal: 20 }} />
        </View>
      )}

      {/* Mini chart */}
      {recent.length > 1 && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 4 }}>
          {recent.reverse().map((entry, i) => {
            const h = ((entry.weight_kg - minW) / range) * 40 + 20;
            return (
              <View key={entry.id} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 9, color: colors.textSecondary, marginBottom: 2 }}>
                  {displayWeight(entry.weight_kg)}
                </Text>
                <View
                  style={{
                    width: '80%',
                    height: h,
                    borderRadius: RADIUS.xs,
                    backgroundColor: colors.primaryLight,
                  }}
                />
              </View>
            );
          })}
        </View>
      )}

      {recent.length === 0 && (
        <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>
          {t('profile.log_weight')}
        </Text>
      )}
    </Card>
  );
}
