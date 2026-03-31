import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { useDeleteEntry } from '../hooks/useDiary';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';
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
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: RADIUS.sm,
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }} numberOfLines={1}>
          {entry.food_name}
        </Text>
        {entry.quantity_g ? (
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>{entry.quantity_g}g</Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '600', color: colors.text }}>
            {Math.round(entry.total_calories)} {t('common.kcal')}
          </Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary }}>
            P{Math.round(entry.total_protein)} C{Math.round(entry.total_carbs)} F{Math.round(entry.total_fat)}
          </Text>
        </View>
        {entry.entry_method === 'photo' && (
          <Ionicons name="camera" size={14} color={colors.textSecondary} />
        )}
      </View>
    </Pressable>
  );
}
