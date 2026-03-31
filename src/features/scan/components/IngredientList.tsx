import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';
import type { FoodItem } from '../types';

interface IngredientListProps {
  items: FoodItem[];
  multiplier: number;
}

export function IngredientList({ items, multiplier }: IngredientListProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const hiddenItems = items.filter((i) => i.hidden);
  const visibleItems = items.filter((i) => !i.hidden);

  return (
    <View>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}
      >
        <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
          {items.length} ingredients
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
      </Pressable>

      {/* Hidden ingredients warning */}
      {hiddenItems.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warningLight, padding: 10, borderRadius: RADIUS.md, marginBottom: 12 }}>
          <Ionicons name="eye-off" size={16} color={colors.warning} />
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.warning, flex: 1 }}>
            {t('scan.hidden_warning')}
          </Text>
        </View>
      )}

      {expanded && (
        <View style={{ gap: 8 }}>
          {visibleItems.map((item, i) => (
            <IngredientRow key={i} item={item} multiplier={multiplier} colors={colors} />
          ))}
          {hiddenItems.length > 0 && (
            <>
              <Text style={{ fontSize: FONT_SIZE.xs, fontWeight: '600', color: colors.warning, marginTop: 8, marginBottom: 4 }}>
                ⚠️ {t('scan.hidden_ingredients')}
              </Text>
              {hiddenItems.map((item, i) => (
                <IngredientRow key={`h-${i}`} item={item} multiplier={multiplier} colors={colors} isHidden />
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

function IngredientRow({ item, multiplier, colors, isHidden }: { item: FoodItem; multiplier: number; colors: any; isHidden?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: isHidden ? colors.warningLight : colors.surface,
        borderRadius: RADIUS.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }}>
          {isHidden ? '⚠️ ' : ''}{item.name}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
          {Math.round(item.g * multiplier)}g
        </Text>
      </View>
      <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '600', color: colors.text }}>
        {Math.round(item.calories * multiplier)} kcal
      </Text>
    </View>
  );
}
