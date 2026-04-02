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
import { track } from '../../../lib/analytics';
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
    update({ goal: selected }, { onSuccess: () => { track('goal_set', { goal: selected }); setVisible(false); } });
  };

  return (
    <>
      <Pressable onPress={() => setVisible(true)}>
        <Card style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{t('profile.edit_goal')}</Text>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
              {t(`onboarding.goal_${profile?.goal || 'maintain'}`)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Card>
      </Pressable>

      <Modal visible={visible} onClose={() => setVisible(false)} title={t('onboarding.goal_title')}>
        <View style={{ gap: 8, marginBottom: 16 }}>
          {GOALS.map((g) => (
            <Pressable
              key={g}
              onPress={() => setSelected(g)}
              style={{
                padding: 14,
                borderRadius: RADIUS.md,
                backgroundColor: selected === g ? colors.primaryLight : colors.surface,
                borderWidth: 2,
                borderColor: selected === g ? colors.primary : 'transparent',
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
