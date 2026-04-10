import React, { useRef } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { RADIUS, SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';

interface DateNavigatorProps {
  date: string;
  onDateChange: (date: string) => void;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  const { i18n } = useTranslation();
  const colors = useColors();
  const listRef = useRef<FlatList>(null);

  const today = new Date().toISOString().split('T')[0];
  // 7 days centered on today: 3 before + today + 3 after
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 3));

  const renderItem = ({ item }: { item: string }) => {
    const d = new Date(item);
    const dayName = d.toLocaleDateString(i18n.language, { weekday: 'short' }).slice(0, 3).toUpperCase();
    const dayNum = d.getDate();
    const isToday = item === today;
    const isSelected = item === date;

    return (
      <Pressable
        onPress={() => onDateChange(item)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${dayName} ${dayNum}`}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: RADIUS.sm,
          minWidth: 48,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSelected ? colors.primarySubtle : 'transparent',
        }}
      >
        <Text
          style={{
            ...typography.overline,
            color: isSelected ? colors.primary : colors.textTertiary,
          }}
        >
          {dayName}
        </Text>
        <Text
          style={{
            ...typography.bodyMedium,
            color: isSelected ? colors.primary : colors.textSecondary,
            marginTop: 2,
          }}
        >
          {dayNum}
        </Text>
        {isToday && (
          <View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.primary,
              marginTop: 4,
            }}
          />
        )}
      </Pressable>
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={days}
      keyExtractor={(item) => item}
      renderItem={renderItem}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: SPACING[6],
        gap: 4,
        justifyContent: 'center',
        flexGrow: 1,
      }}
    />
  );
}
