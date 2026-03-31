import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { FONT_SIZE } from '../../../lib/constants';

interface DateNavigatorProps {
  date: string;
  onDateChange: (date: string) => void;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

export function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);

  let label = date;
  if (date === today) label = t('diary.today');
  else if (date === yesterday) label = t('diary.yesterday');
  else if (date === tomorrow) label = t('diary.tomorrow');
  else {
    const d = new Date(date);
    label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
      <Pressable onPress={() => onDateChange(addDays(date, -1))} style={{ padding: 8 }}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>

      <Pressable onPress={() => onDateChange(today)} style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{label}</Text>
      </Pressable>

      <Pressable
        onPress={() => onDateChange(addDays(date, 1))}
        style={{ padding: 8 }}
        disabled={date >= today}
      >
        <Ionicons name="chevron-forward" size={24} color={date >= today ? colors.border : colors.text} />
      </Pressable>
    </View>
  );
}
