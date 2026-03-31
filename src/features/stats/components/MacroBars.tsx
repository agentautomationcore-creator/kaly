import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { ProgressBar } from '../../../components/ProgressBar';
import { FONT_SIZE } from '../../../lib/constants';

interface MacroBarsProps {
  protein: number;
  carbs: number;
  fat: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
}

export const MacroBars = React.memo(function MacroBars({
  protein,
  carbs,
  fat,
  proteinGoal = 150,
  carbsGoal = 200,
  fatGoal = 67,
}: MacroBarsProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <View style={{ gap: 12 }}>
      <ProgressBar
        label={t('stats.protein')}
        value={protein}
        max={proteinGoal}
        color={colors.proteinColor}
      />
      <ProgressBar
        label={t('stats.carbs')}
        value={carbs}
        max={carbsGoal}
        color={colors.carbsColor}
      />
      <ProgressBar
        label={t('stats.fat')}
        value={fat}
        max={fatGoal}
        color={colors.fatColor}
      />
    </View>
  );
});
