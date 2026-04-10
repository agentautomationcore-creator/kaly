import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { ProgressBar } from '../../../components/ProgressBar';
import { typography } from '../../../lib/typography';
import { formatNumber } from '../../../lib/formatNumber';
import { rtlRow } from '../../../lib/rtl';

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

  const bars = [
    { label: t('stats.protein'), value: protein, goal: proteinGoal, color: colors.protein, delay: 0 },
    { label: t('stats.carbs'), value: carbs, goal: carbsGoal, color: colors.carbs, delay: 100 },
    { label: t('stats.fat'), value: fat, goal: fatGoal, color: colors.fat, delay: 200 },
  ];

  return (
    <View style={{ gap: 12 }}>
      {bars.map((bar) => (
        <View key={bar.label}>
          <View style={{ flexDirection: rtlRow(), justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ ...typography.smallMedium, color: bar.color }}>{bar.label}</Text>
            <Text style={{ ...typography.small, color: colors.textSecondary }}>
              {formatNumber(Math.round(bar.value))}g / {formatNumber(Math.round(bar.goal))}g
            </Text>
          </View>
          <ProgressBar
            value={bar.value}
            max={bar.goal}
            color={bar.color}
            showValue={false}
            delay={bar.delay}
            height={8}
          />
        </View>
      ))}
    </View>
  );
});
