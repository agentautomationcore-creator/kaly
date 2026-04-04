import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
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
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const [showPicker, setShowPicker] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);

  let label = date;
  if (date === today) label = t('diary.today');
  else if (date === yesterday) label = t('diary.yesterday');
  else if (date === tomorrow) label = t('diary.tomorrow');
  else {
    const d = new Date(date);
    label = d.toLocaleDateString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // EDGE-5: Quick date picker — last 7 days
  const quickDates = Array.from({ length: 7 }, (_, i) => addDays(today, -i));

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => onDateChange(addDays(date, -1))} style={{ padding: 8, minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }} accessibilityLabel={t('diary.yesterday')} accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <Pressable onPress={() => setShowPicker(!showPicker)} style={{ alignItems: 'center', flexDirection: 'row', gap: 6, minHeight: 44, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={label}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{label}</Text>
          <Ionicons name={showPicker ? 'chevron-up' : 'calendar-outline'} size={16} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => onDateChange(addDays(date, 1))}
          style={{ padding: 8, minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }}
          disabled={date >= today}
          accessibilityLabel={t('diary.tomorrow')}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-forward" size={24} color={date >= today ? colors.border : colors.text} />
        </Pressable>
      </View>

      {showPicker && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 8, paddingBottom: 8 }}>
          {quickDates.map((d) => {
            const dayLabel = new Date(d).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric' });
            const isSelected = d === date;
            return (
              <Pressable
                key={d}
                onPress={() => { onDateChange(d); setShowPicker(false); }}
                accessibilityRole="button"
                accessibilityLabel={dayLabel}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  minHeight: 44,
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: isSelected ? colors.primaryLight : 'transparent',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: isSelected ? '700' : '400', color: isSelected ? colors.primary : colors.textSecondary, textAlign: 'center' }}>
                  {dayLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
