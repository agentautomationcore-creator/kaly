import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { CalorieRing } from '../../stats/components/CalorieRing';
import { Card } from '../../../components/Card';
import { FONT_SIZE } from '../../../lib/constants';
import { formatNumber } from '../../../lib/formatNumber';

interface DailyTotalsBarProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieGoal?: number;
}

export function DailyTotalsBar({ calories, protein, carbs, fat, calorieGoal = 2000 }: DailyTotalsBarProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const remaining = calorieGoal - calories;

  // Neutral color for "over" text — no guilt-tripping
  const overColor = remaining >= 0 ? colors.success : colors.overGoal;

  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
      {/* Calorie ring + remaining */}
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <CalorieRing current={calories} goal={calorieGoal} size={140} />
        <Text style={{ fontSize: FONT_SIZE.sm, color: overColor, fontWeight: '500', marginTop: 8 }}>
          {remaining >= 0
            ? t('diary.remaining', { count: formatNumber(Math.round(remaining)) })
            : t('diary.over', { count: formatNumber(Math.abs(Math.round(remaining))) })}
        </Text>
      </View>

      {/* Macros */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <MacroChip label={t('stats.protein')} value={protein} unit={t('units.g')} color={colors.proteinColor} />
        <MacroChip label={t('stats.carbs')} value={carbs} unit={t('units.g')} color={colors.carbsColor} />
        <MacroChip label={t('stats.fat')} value={fat} unit={t('units.g')} color={colors.fatColor} />
      </View>
    </Card>
  );
}

function MacroChip({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginBottom: 4 }} />
      <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '700', color: colors.text }}>
        {formatNumber(Math.round(value))}{unit}
      </Text>
      <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}
