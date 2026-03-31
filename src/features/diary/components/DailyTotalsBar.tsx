import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { ProgressBar } from '../../../components/ProgressBar';
import { Card } from '../../../components/Card';
import { FONT_SIZE } from '../../../lib/constants';

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

  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
      {/* Calorie summary */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 32, fontWeight: '800', color: colors.primary }}>{Math.round(calories)}</Text>
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>{t('common.kcal')}</Text>
        </View>
        <Text style={{ fontSize: FONT_SIZE.sm, color: remaining >= 0 ? colors.success : colors.danger, fontWeight: '500' }}>
          {remaining >= 0
            ? t('diary.remaining', { count: Math.round(remaining) })
            : t('diary.over', { count: Math.abs(Math.round(remaining)) })}
        </Text>
      </View>

      {/* Calorie progress */}
      <ProgressBar
        value={calories}
        max={calorieGoal}
        color={calories > calorieGoal ? colors.danger : colors.primary}
        showValue={false}
        height={6}
        style={{ marginBottom: 16 }}
      />

      {/* Macros */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <MacroChip label={t('stats.protein')} value={protein} unit="g" color={colors.proteinColor} />
        <MacroChip label={t('stats.carbs')} value={carbs} unit="g" color={colors.carbsColor} />
        <MacroChip label={t('stats.fat')} value={fat} unit="g" color={colors.fatColor} />
      </View>
    </Card>
  );
}

function MacroChip({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginBottom: 4 }} />
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
        {Math.round(value)}{unit}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}
