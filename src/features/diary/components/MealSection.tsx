import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { Card } from '../../../components/Card';
import { MealRow } from './MealRow';
import { FONT_SIZE } from '../../../lib/constants';
import type { DiaryEntry } from '../types';
import type { MealType } from '../../../lib/types';

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

interface MealSectionProps {
  mealType: MealType;
  entries: DiaryEntry[];
  date: string;
}

export const MealSection = React.memo(function MealSection({ mealType, entries, date }: MealSectionProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();

  const totalCal = entries.reduce((s, e) => s + e.total_calories, 0);

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: entries.length > 0 ? 12 : 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={MEAL_ICONS[mealType] as any} size={18} color={colors.textSecondary} />
          <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
            {t(`diary.${mealType}`)}
          </Text>
          {totalCal > 0 && (
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>
              {Math.round(totalCal)} {t('common.kcal')}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/scan')}
          accessibilityLabel={t('diary.add_food')}
          accessibilityRole="button"
          style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {entries.length > 0 ? (
        <View style={{ gap: 4 }}>
          {entries.map((entry) => (
            <MealRow key={entry.id} entry={entry} />
          ))}
        </View>
      ) : null}
    </Card>
  );
});
