import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors, type Colors } from '../../../lib/theme';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';
import { formatNumber } from '../../../lib/formatNumber';
import { useScanStore } from '../store/scanStore';
import type { FoodItem } from '../types';

interface IngredientListProps {
  items: FoodItem[];
  multiplier: number;
}

export function IngredientList({ items, multiplier }: IngredientListProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const { updateItem, removeItem, addItem } = useScanStore();

  const { hiddenItems, visibleItems, hiddenIndices, visibleIndices } = useMemo(() => {
    const hi: number[] = [];
    const vi: number[] = [];
    items.forEach((item, i) => {
      if (item.hidden) hi.push(i);
      else vi.push(i);
    });
    return {
      hiddenItems: hi.map((i) => items[i]),
      visibleItems: vi.map((i) => items[i]),
      hiddenIndices: hi,
      visibleIndices: vi,
    };
  }, [items]);

  const handleAddItem = () => {
    addItem({
      name: '',
      name_en: '',
      g: 100,
      calories: 100,
      protein_g: 5,
      fat_g: 3,
      carbs_g: 15,
      fiber_g: 1,
      confidence: 0.5,
      hidden: false,
    });
  };

  return (
    <View>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, minHeight: MIN_TOUCH }}
        accessibilityRole="button"
        accessibilityLabel={t('scan.ingredients_count', { count: items.length })}
      >
        <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
          {t('scan.ingredients_count', { count: items.length })}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
      </Pressable>

      {/* Hidden ingredients warning */}
      {hiddenItems.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: colors.warningLight, padding: 10, borderRadius: RADIUS.md, marginBottom: SPACING.md }}>
          <Ionicons name="eye-off" size={16} color={colors.warning} />
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.warning, flex: 1 }}>
            {t('scan.hidden_warning')}
          </Text>
        </View>
      )}

      {expanded && (
        <View style={{ gap: SPACING.sm }}>
          {visibleItems.map((item, localIdx) => (
            <EditableIngredientRow
              key={visibleIndices[localIdx]}
              item={item}
              multiplier={multiplier}
              colors={colors}
              onUpdate={(updates) => updateItem(visibleIndices[localIdx], updates)}
              onRemove={() => removeItem(visibleIndices[localIdx])}
            />
          ))}
          {hiddenItems.length > 0 && (
            <>
              <Text style={{ fontSize: FONT_SIZE.xs, fontWeight: '600', color: colors.warning, marginTop: 8, marginBottom: 4 }}>
                {t('scan.hidden_ingredients')}
              </Text>
              {hiddenItems.map((item, localIdx) => (
                <EditableIngredientRow
                  key={`h-${hiddenIndices[localIdx]}`}
                  item={item}
                  multiplier={multiplier}
                  colors={colors}
                  isHidden
                  onUpdate={(updates) => updateItem(hiddenIndices[localIdx], updates)}
                  onRemove={() => removeItem(hiddenIndices[localIdx])}
                />
              ))}
            </>
          )}

          {/* Add item button */}
          <Pressable
            onPress={handleAddItem}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACING.sm,
              paddingVertical: SPACING.md,
              borderRadius: RADIUS.md,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.border,
              minHeight: MIN_TOUCH,
            }}
            accessibilityRole="button"
            accessibilityLabel={t('scan.add_item')}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, fontWeight: '500' }}>
              {t('scan.add_item')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

interface EditableRowProps {
  item: FoodItem;
  multiplier: number;
  colors: Colors;
  isHidden?: boolean;
  onUpdate: (updates: Partial<FoodItem>) => void;
  onRemove: () => void;
}

function EditableIngredientRow({ item, multiplier, colors, isHidden, onUpdate, onRemove }: EditableRowProps) {
  const { t } = useTranslation();
  const [editingName, setEditingName] = useState(false);
  const [editingGrams, setEditingGrams] = useState(false);
  const [nameVal, setNameVal] = useState(item.name);
  const [gramsVal, setGramsVal] = useState(String(Math.round(item.g)));

  const handleNameDone = () => {
    if (nameVal.trim()) onUpdate({ name: nameVal.trim() });
    setEditingName(false);
  };

  const handleGramsDone = () => {
    const g = parseInt(gramsVal, 10);
    if (g > 0) onUpdate({ g });
    setEditingGrams(false);
  };

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
        {editingName ? (
          <TextInput
            value={nameVal}
            onChangeText={setNameVal}
            onBlur={handleNameDone}
            onSubmitEditing={handleNameDone}
            autoFocus
            accessibilityLabel={t('scan.ingredient_name')}
            style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text, padding: 0, borderBottomWidth: 1, borderColor: colors.primary }}
          />
        ) : (
          <Pressable onPress={() => setEditingName(true)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={t('common.edit') || item.name}>
            <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }}>
              {isHidden ? '⚠️ ' : ''}{item.name}
            </Text>
          </Pressable>
        )}

        {editingGrams ? (
          <TextInput
            value={gramsVal}
            onChangeText={setGramsVal}
            onBlur={handleGramsDone}
            onSubmitEditing={handleGramsDone}
            keyboardType="numeric"
            autoFocus
            accessibilityLabel={t('scan.ingredient_grams')}
            style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, padding: 0, borderBottomWidth: 1, borderColor: colors.primary, width: 60 }}
          />
        ) : (
          <Pressable onPress={() => { setGramsVal(String(Math.round(item.g))); setEditingGrams(true); }} style={{ minHeight: MIN_TOUCH, paddingHorizontal: 8, justifyContent: 'center' }}>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>
              {formatNumber(Math.round(item.g * multiplier))} {t('units.g')}
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '600', color: colors.text, marginEnd: 8 }}>
        {formatNumber(Math.round(item.calories * multiplier))} {t('common.kcal')}
      </Text>

      {/* Delete button */}
      <Pressable
        onPress={onRemove}
        style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}
        accessibilityRole="button"
        accessibilityLabel={t('common.delete')}
      >
        <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}
