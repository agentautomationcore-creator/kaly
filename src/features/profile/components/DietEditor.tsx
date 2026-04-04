import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { useUpdateProfile } from '../hooks/useProfile';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';
import type { NutritionProfile } from '../types';

const DIETS = ['balanced', 'keto', 'vegan', 'vegetarian', 'paleo'] as const;
const ALLERGIES = ['gluten', 'dairy', 'nuts', 'shellfish', 'eggs', 'soy'] as const;

interface DietEditorProps {
  profile: NutritionProfile | null;
}

export function DietEditor({ profile }: DietEditorProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [diet, setDiet] = useState(profile?.diet_type || 'balanced');
  const [allergies, setAllergies] = useState<string[]>(profile?.allergies || []);
  const { mutate: update, isPending } = useUpdateProfile();

  const toggleAllergy = (a: string) => {
    setAllergies((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const handleSave = () => {
    update({ diet_type: diet, allergies }, { onSuccess: () => setVisible(false) });
  };

  return (
    <>
      <Pressable onPress={() => setVisible(true)}>
        <Card style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{t('profile.edit_diet')}</Text>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
              {t(`onboarding.diet_${profile?.diet_type || 'balanced'}`)}
              {profile?.allergies?.length ? ` · ${t('profile.allergies_count', { count: profile.allergies.length })}` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Card>
      </Pressable>

      <Modal visible={visible} onClose={() => setVisible(false)} title={t('onboarding.diet_title')}>
        <View style={{ gap: 8, marginBottom: 16 }}>
          {DIETS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDiet(d)}
              accessibilityRole="button"
              style={{
                padding: 12,
                minHeight: 44,
                borderRadius: RADIUS.md,
                backgroundColor: diet === d ? colors.primaryLight : colors.surface,
                borderWidth: 1.5,
                borderColor: diet === d ? colors.primary : 'transparent',
              }}
            >
              <Text style={{ fontWeight: '500', color: diet === d ? colors.primary : colors.text }}>
                {t(`onboarding.diet_${d}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {ALLERGIES.map((a) => {
            const sel = allergies.includes(a);
            return (
              <Pressable
                key={a}
                onPress={() => toggleAllergy(a)}
                accessibilityRole="switch"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  minHeight: 44,
                  justifyContent: 'center',
                  borderRadius: RADIUS.full,
                  backgroundColor: sel ? colors.dangerLight : colors.surface,
                  borderWidth: 1.5,
                  borderColor: sel ? colors.danger : 'transparent',
                }}
              >
                <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: sel ? colors.danger : colors.text }}>
                  {t(`onboarding.allergy_${a}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button title={t('common.save')} onPress={handleSave} loading={isPending} />
      </Modal>
    </>
  );
}
