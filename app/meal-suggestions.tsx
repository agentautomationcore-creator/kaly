import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../src/lib/theme';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { IconButton } from '../src/components/IconButton';
import { RADIUS, MIN_TOUCH, SPACING, SHADOW } from '../src/lib/constants';
import { typography } from '../src/lib/typography';
import { useAuthStore } from '../src/stores/authStore';

export default function MealSuggestionsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const isPro = profile?.plan === 'pro';

  // Placeholder suggestions — in real implementation these come from AI
  const suggestions = [
    { id: '1', emoji: '\uD83E\uDD57', name: 'Greek Salad with Chicken', cal: 420, protein: 35, carbs: 18, fat: 22, tags: ['High Protein', 'Low Carb'] },
    { id: '2', emoji: '\uD83C\uDF5D', name: 'Pasta Primavera', cal: 380, protein: 14, carbs: 55, fat: 12, tags: ['Vegetarian', 'Balanced'] },
    { id: '3', emoji: '\uD83C\uDF5B', name: 'Salmon Bowl', cal: 510, protein: 38, carbs: 42, fat: 18, tags: ['Omega-3', 'High Protein'] },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING[4] }}>
        <IconButton icon="chevron-back" onPress={() => router.back()} accessibilityLabel={t('common.back')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING[4], paddingBottom: 100 }}>
        {/* Header */}
        <Text style={{ ...typography.title, color: colors.textPrimary, marginBottom: SPACING[2] }}>
          {t('suggestions.title')}
        </Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: SPACING[6] }}>
          {t('suggestions.subtitle')}
        </Text>

        {/* Remaining summary */}
        <Text style={{ ...typography.smallMedium, color: colors.primary, marginBottom: SPACING[4] }}>
          {t('suggestions.remaining')}
        </Text>

        {/* Suggestion cards */}
        {suggestions.slice(0, isPro ? suggestions.length : 1).map((s) => (
          <Card key={s.id} style={{ marginBottom: SPACING[3], ...SHADOW.sm }}>
            {/* Image area */}
            <LinearGradient
              colors={[colors.primarySubtle, colors.secondarySubtle]}
              style={{ height: 140, borderRadius: RADIUS.lg, marginBottom: SPACING[3], justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 48 }}>{s.emoji}</Text>
            </LinearGradient>

            <Text style={{ ...typography.h2, color: colors.textPrimary, marginBottom: SPACING[1] }}>{s.name}</Text>

            {/* Macros row */}
            <View style={{ flexDirection: 'row', gap: SPACING[3], marginBottom: SPACING[2] }}>
              <Text style={{ ...typography.small, color: colors.textSecondary }}>{s.cal} kcal</Text>
              <Text style={{ ...typography.small, color: colors.protein }}>P: {s.protein}g</Text>
              <Text style={{ ...typography.small, color: colors.carbs }}>C: {s.carbs}g</Text>
              <Text style={{ ...typography.small, color: colors.fat }}>F: {s.fat}g</Text>
            </View>

            {/* Tags */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: SPACING[3] }}>
              {s.tags.map((tag) => (
                <View key={tag} style={{ backgroundColor: colors.primarySubtle, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.xs }}>
                  <Text style={{ ...typography.caption, color: colors.primary }}>{tag}</Text>
                </View>
              ))}
            </View>

            <Button title={`${t('suggestions.add')} \u2192`} variant="secondary" onPress={() => {}} />
          </Card>
        ))}

        {/* PRO upsell card */}
        {!isPro && (
          <Card style={{ marginBottom: SPACING[3], borderWidth: 2, borderColor: colors.primary, alignItems: 'center' }}>
            <Text style={{ ...typography.h3, color: colors.primary, marginBottom: SPACING[2] }}>
              {t('suggestions.unlock')}
            </Text>
            <Text style={{ ...typography.small, color: colors.textSecondary, textAlign: 'center', marginBottom: SPACING[3] }}>
              {t('suggestions.pro_desc')}
            </Text>
            <Button title={t('suggestions.unlock')} onPress={() => router.push('/paywall')} />
          </Card>
        )}

        {/* Refresh */}
        <Pressable
          onPress={() => {}}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: MIN_TOUCH, marginTop: SPACING[3] }}
          accessibilityRole="button"
        >
          <Text style={{ ...typography.bodyMedium, color: colors.primary }}>
            {t('suggestions.refresh')} \uD83D\uDD04
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
