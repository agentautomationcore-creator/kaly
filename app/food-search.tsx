import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { backIcon } from '../src/lib/rtl';
import { useColors } from '../src/lib/theme';
import { Button } from '../src/components/Button';
import { useFoodSearch, FoodSearchItem } from '../src/hooks/useFoodSearch';
import { useDebounce } from '../src/hooks/useDebounce';
import { RADIUS, MIN_TOUCH, SPACING } from '../src/lib/constants';
import { typography } from '../src/lib/typography';
import { formatNumber } from '../src/lib/formatNumber';

/** Decode HTML entities from OpenFoodFacts data */
function decodeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export default function FoodSearchScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: string }>();
  const mealType = params.mealType || 'snack';

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { results, isSearching, search, clear } = useFoodSearch();

  useEffect(() => {
    if (debouncedQuery.length >= 2) search(debouncedQuery);
    else clear();
  }, [debouncedQuery]);

  const selectFood = (item: FoodSearchItem) => {
    router.push({
      pathname: '/manual-entry',
      params: {
        mealType, name: item.name, brand: item.brand || '',
        calories: String(item.calories), protein: String(item.protein),
        carbs: String(item.carbs), fat: String(item.fat), fiber: String(item.fiber),
        serving_size: item.serving_size, barcode: item.barcode, entry_method: 'search',
        ...(item.community_product_id ? { community_product_id: item.community_product_id } : {}),
      },
    });
  };

  const renderItem = ({ item }: { item: FoodSearchItem }) => (
    <Pressable
      onPress={() => selectFood(item)}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: SPACING[3],
        paddingVertical: SPACING[3], paddingHorizontal: SPACING[4],
        minHeight: MIN_TOUCH, borderBottomWidth: 0.5, borderColor: colors.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={`${item.name} ${item.calories} kcal`}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={{ width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: colors.surface }} />
      ) : (
        <View style={{ width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="nutrition-outline" size={20} color={colors.textSecondary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.bodyMedium, color: colors.textPrimary }} numberOfLines={1} ellipsizeMode="tail">{decodeHtml(item.name)}</Text>
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>
          {formatNumber(item.calories)} {t('common.kcal')} {'\u2022'} {formatNumber(item.protein)}{t('common.g')} {t('common.protein_short')} {'\u2022'} {t('food_search.per_100g')}
        </Text>
      </View>
    </Pressable>
  );

  // Skeleton shimmer rows
  const SkeletonRow = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[3], paddingVertical: SPACING[3], paddingHorizontal: SPACING[4] }}>
      <View style={{ width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: colors.surface }} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ height: 14, width: '70%', borderRadius: 4, backgroundColor: colors.surface }} />
        <View style={{ height: 10, width: '50%', borderRadius: 4, backgroundColor: colors.surface }} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Search bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2], paddingHorizontal: SPACING[4], paddingVertical: SPACING[2] }}>
        <Pressable onPress={() => router.back()} style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, justifyContent: 'center', alignItems: 'center' }} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <Ionicons name={backIcon()} size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 52, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.sm, paddingHorizontal: SPACING[3] }}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('food_search.placeholder')}
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel={t('food_search.placeholder')}
            autoFocus
            returnKeyType="search"
            style={{ flex: 1, ...typography.body, color: colors.textPrimary, marginLeft: 8, padding: 0 }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); clear(); }} style={{ padding: 4 }} accessibilityRole="button" accessibilityLabel={t('common.clear')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Loading skeleton */}
      {isSearching && (
        <View>{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</View>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.barcode || item.name}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !isSearching && debouncedQuery.length >= 2 ? (
            <View style={{ padding: SPACING[6], alignItems: 'center' }}>
              <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: SPACING[3] }}>
                {t('food_search.no_results')}
              </Text>
              <Button title={t('food_search.add_manually')} variant="ghost" onPress={() => router.push({ pathname: '/manual-entry', params: { mealType, entry_method: 'manual' } })} />
            </View>
          ) : null
        }
      />

      {/* Manual entry — always at bottom */}
      <Pressable
        onPress={() => router.push({ pathname: '/manual-entry', params: { mealType, entry_method: 'manual' } })}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          minHeight: MIN_TOUCH + 8, borderTopWidth: 1, borderColor: colors.border,
          backgroundColor: colors.surfaceElevated, paddingVertical: SPACING[3],
        }}
        accessibilityRole="button" accessibilityLabel={t('food_search.enter_manually')}
      >
        <Text style={{ ...typography.bodyMedium, color: colors.primary }}>
          {t('food_search.enter_manually')} {'\u2192'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

