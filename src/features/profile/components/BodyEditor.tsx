import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { useUpdateProfile } from '../hooks/useProfile';
import { useSettingsStore } from '../../../stores/settingsStore';
import { calculateTDEE } from '../../../lib/nutrition';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';
import type { NutritionProfile } from '../types';

interface BodyEditorProps {
  profile: NutritionProfile | null;
}

export function BodyEditor({ profile }: BodyEditorProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState(String(profile?.height_cm || ''));
  const [weight, setWeight] = useState(String(profile?.weight_kg || ''));
  const [age, setAge] = useState(String(profile?.age || ''));
  const { mutate: update, isPending } = useUpdateProfile();
  const units = useSettingsStore((s) => s.units);

  const handleSave = () => {
    const w = parseFloat(weight);
    const a = parseInt(age);
    const h = parseInt(height);

    if (!isNaN(w) && (w < 20 || w > 300)) {
      Alert.alert(t('validation.invalid_weight'));
      return;
    }
    if (!isNaN(a) && (a < 12 || a > 120)) {
      Alert.alert(t('validation.invalid_age'));
      return;
    }

    const updates: Partial<NutritionProfile> = {
      height_cm: isNaN(h) ? undefined : h,
      weight_kg: isNaN(w) ? undefined : w,
      age: isNaN(a) ? undefined : a,
    };

    // Recalculate TDEE
    if (!isNaN(h) && !isNaN(w) && !isNaN(a) && profile?.gender && profile?.activity_level) {
      const tdee = calculateTDEE(w, h, a, profile.gender as 'male' | 'female', profile.activity_level as Parameters<typeof calculateTDEE>[4]);
      const goalMultiplier = profile.goal === 'lose' ? 0.8 : profile.goal === 'gain' ? 1.15 : 1;
      updates.daily_calories = Math.round(tdee * goalMultiplier);
    }

    update(updates, { onSuccess: () => setVisible(false) });
  };

  const fields = [
    { label: t('onboarding.height'), value: height, set: setHeight, suffix: units === 'imperial' ? t('units.ft') : t('units.cm') },
    { label: t('onboarding.weight'), value: weight, set: setWeight, suffix: units === 'imperial' ? t('units.lbs') : t('units.kg') },
    { label: t('onboarding.age'), value: age, set: setAge, suffix: t('units.years') },
  ];

  return (
    <>
      <Pressable onPress={() => setVisible(true)}>
        <Card style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{t('profile.edit_body')}</Text>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
              {profile?.height_cm ? `${profile.height_cm} ${t('units.cm')} · ${profile.weight_kg} ${t('units.kg')} · ${profile.age} ${t('units.years')}` : '—'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Card>
      </Pressable>

      <Modal visible={visible} onClose={() => setVisible(false)} title={t('onboarding.body_title')}>
        <View style={{ gap: 12, marginBottom: 16 }}>
          {fields.map((f) => (
            <View key={f.label}>
              <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginBottom: 4 }}>
                {f.label} {f.suffix ? `(${f.suffix})` : ''}
              </Text>
              <TextInput
                value={f.value}
                onChangeText={f.set}
                keyboardType="numeric"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: RADIUS.md,
                  padding: 14,
                  fontSize: FONT_SIZE.md,
                  color: colors.text,
                }}
              />
            </View>
          ))}
        </View>
        <Button title={t('common.save')} onPress={handleSave} loading={isPending} />
      </Modal>
    </>
  );
}
