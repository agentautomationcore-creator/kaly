import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { forwardIcon } from '../../../lib/rtl';
import { useColors } from '../../../lib/theme';
import { useUpdateProfile } from '../hooks/useProfile';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { FONT_SIZE, RADIUS, SPACING, MIN_TOUCH } from '../../../lib/constants';
import { track } from '../../../lib/analytics';
import { calculateTDEE, calculateDailyTarget, calculateMacroSplit } from '../../../lib/nutrition';
import type { Gender, ActivityLevel, Goal as GoalType, DietType } from '../../../lib/nutrition';
import type { NutritionProfile } from '../types';

const GOALS = ['lose', 'maintain', 'gain'] as const;

interface GoalEditorProps {
  profile: NutritionProfile | null;
}

export function GoalEditor({ profile }: GoalEditorProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(profile?.goal || 'maintain');
  const { mutate: update, isPending } = useUpdateProfile();

  const handleSave = () => {
    // GOAL-4: Recalculate daily calories and macros when goal changes
    const updates: Record<string, unknown> = { goal: selected };
    if (profile?.weight_kg && profile?.height_cm && profile?.age && profile?.gender) {
      const tdee = calculateTDEE(
        profile.weight_kg,
        profile.height_cm,
        profile.age,
        profile.gender as Gender,
        (profile.activity_level || 'moderate') as ActivityLevel
      );
      const dailyCalories = calculateDailyTarget(tdee, selected as GoalType);
      const diet = (profile.diet_type || 'balanced') as DietType;
      const macros = calculateMacroSplit(dailyCalories, diet);
      const proteinPct = Math.round((macros.protein_g * 4 / dailyCalories) * 100);
      const carbsPct = Math.round((macros.carbs_g * 4 / dailyCalories) * 100);
      const fatPct = 100 - proteinPct - carbsPct;
      Object.assign(updates, { daily_calories: dailyCalories, protein_pct: proteinPct, carbs_pct: carbsPct, fat_pct: fatPct });
    }
    update(updates, { onSuccess: () => { track('goal_set', { goal: selected }); setVisible(false); } });
  };

  return (
    <>
      <Pressable onPress={() => setVisible(true)} accessibilityRole="button" accessibilityLabel={t('profile.edit_goal')}>
        <Card style={{ marginBottom: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{t('profile.edit_goal')}</Text>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
              {t(`onboarding.goal_${profile?.goal || 'maintain'}`)}
            </Text>
          </View>
          <Ionicons name={forwardIcon()} size={20} color={colors.textSecondary} />
        </Card>
      </Pressable>

      <Modal visible={visible} onClose={() => setVisible(false)} title={t('onboarding.goal_title')}>
        <View style={{ gap: SPACING.sm, marginBottom: SPACING.lg }}>
          {GOALS.map((g) => (
            <Pressable
              key={g}
              disabled={isPending}
              onPress={() => setSelected(g)}
              accessibilityRole="button"
              style={{
                padding: SPACING.lg,
                borderRadius: RADIUS.md,
                backgroundColor: selected === g ? colors.primaryLight : colors.surface,
                borderWidth: 2,
                borderColor: selected === g ? colors.primary : 'transparent',
                minHeight: MIN_TOUCH,
              }}
            >
              <Text style={{ fontWeight: '600', color: selected === g ? colors.primary : colors.text }}>
                {t(`onboarding.goal_${g}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button title={t('common.save')} onPress={handleSave} loading={isPending} />
      </Modal>
    </>
  );
}
