import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../src/lib/theme';
import { useFoodSearch, FoodSearchItem } from '../src/hooks/useFoodSearch';
import { useDebounce } from '../src/hooks/useDebounce';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../src/lib/constants';
import { formatNumber } from '../src/lib/formatNumber';

export default function FoodSearchScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: string }>();
  const mealType = params.mealType || 'snack';

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const { results, isSearching, search, clear } = useFoodSearch();

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      search(debouncedQuery);
    } else {
      clear();
    }
  }, [debouncedQuery]);

  const selectFood = (item: FoodSearchItem) => {
    router.push({
      pathname: '/manual-entry',
      params: {
        mealType,
        name: item.name,
        brand: item.brand || '',
        calories: String(item.calories),
        protein: String(item.protein),
        carbs: String(item.carbs),
        fat: String(item.fat),
        fiber: String(item.fiber),
        serving_size: item.serving_size,
        barcode: item.barcode,
        entry_method: 'search',
      },
    });
  };

  const renderItem = ({ item }: { item: FoodSearchItem }) => (
    <Pressable
      onPress={() => selectFood(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        minHeight: MIN_TOUCH,
        borderBottomWidth: 0.5,
        borderColor: colors.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={`${item.name} ${item.calories} kcal`}
    >
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={{ width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: colors.surface }}
        />
      ) : (
        <View style={{ width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="nutrition-outline" size={20} color={colors.textSecondary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '500', color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
        {item.brand ? (
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }} numberOfLines={1} ellipsizeMode="tail">
            {item.brand}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.primary }}>
          {formatNumber(item.calories)}
        </Text>
        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>
          {t('common.kcal')}/100g
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm }}>
        <Pressable
          onPress={() => router.back()}
          style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, justifyContent: 'center', alignItems: 'center' }}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('food_search.placeholder')}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={t('food_search.placeholder')}
          autoFocus
          returnKeyType="search"
          style={{
            flex: 1,
            minHeight: MIN_TOUCH,
            fontSize: FONT_SIZE.md,
            color: colors.text,
            backgroundColor: colors.surface,
            borderRadius: RADIUS.md,
            paddingHorizontal: SPACING.lg,
          }}
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => { setQuery(''); clear(); }}
            style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, justifyContent: 'center', alignItems: 'center' }}
            accessibilityRole="button"
            accessibilityLabel={t('common.clear')}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Loading */}
      {isSearching && (
        <View style={{ padding: SPACING.lg, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.barcode || item.name}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !isSearching && debouncedQuery.length >= 2 ? (
            <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
              <Text style={{ fontSize: FONT_SIZE.md, color: colors.textSecondary, textAlign: 'center' }}>
                {t('food_search.no_results')}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Manual entry button — always at bottom */}
      <Pressable
        onPress={() => router.push({ pathname: '/manual-entry', params: { mealType, entry_method: 'manual' } })}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
          minHeight: MIN_TOUCH + 8,
          borderTopWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          paddingVertical: SPACING.md,
        }}
        accessibilityRole="button"
        accessibilityLabel={t('food_search.enter_manually')}
      >
        <Ionicons name="create-outline" size={20} color={colors.primary} />
        <Text style={{ fontSize: FONT_SIZE.md, color: colors.primary, fontWeight: '600' }}>
          {t('food_search.enter_manually')}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
