import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { useDeleteEntry } from '../hooks/useDiary';
import { Badge } from '../../../components/Badge';
import { SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';
import { formatNumber } from '../../../lib/formatNumber';
import type { DiaryEntry } from '../types';

interface MealRowProps {
  entry: DiaryEntry;
}

export function MealRow({ entry }: MealRowProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { mutate: deleteEntry } = useDeleteEntry();

  const handleDelete = () => {
    Alert.alert(t('diary.delete_entry'), t('diary.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteEntry(entry.id) },
    ]);
  };

  return (
    <Pressable
      onLongPress={handleDelete}
      accessibilityRole="button"
      accessibilityLabel={`${entry.food_name} ${formatNumber(Math.round(entry.total_calories))} ${t('common.kcal')}`}
      accessibilityHint={t('hints.swipe_delete')}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: SPACING[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ ...typography.body, color: colors.textPrimary }} numberOfLines={1} ellipsizeMode="tail">
          {entry.food_name}
        </Text>
        {entry.entry_method === 'photo' && <Badge variant="ai" label="AI" />}
      </View>

      <Text style={{ ...typography.small, color: colors.textSecondary, fontVariant: ['tabular-nums'] }}>
        {formatNumber(Math.round(entry.total_calories))} {t('common.kcal')}
      </Text>
    </Pressable>
  );
}
