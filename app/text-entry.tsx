import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../src/lib/theme';
import { Button } from '../src/components/Button';
import { NutritionResultCard } from '../src/features/scan/components/NutritionResultCard';
import { useAnalyzeText } from '../src/features/scan/hooks/useAnalyzeFood';
import { useScanStore } from '../src/features/scan/store/scanStore';
import { RADIUS, MIN_TOUCH, SPACING } from '../src/lib/constants';
import { typography } from '../src/lib/typography';

export default function TextEntryScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const [text, setText] = useState('');
  const analyzeText = useAnalyzeText();
  const { result, isAnalyzing, error, reset } = useScanStore();

  const canAnalyze = text.trim().length >= 2 && !isAnalyzing;

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    analyzeText.mutate(text.trim());
  };

  const handleClose = () => {
    reset();
    router.back();
  };

  // Show result card when analysis is done
  if (result) {
    return <NutritionResultCard entryMethod="text" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING[4], paddingVertical: SPACING[2] }}>
          <Pressable onPress={handleClose} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={t('common.close')}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ ...typography.h3, color: colors.textPrimary }}>{t('text_entry.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Content */}
        <View style={{ flex: 1, padding: SPACING[4], gap: SPACING[4] }}>
          {/* Hint */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2], padding: SPACING[3], backgroundColor: colors.primarySubtle, borderRadius: RADIUS.lg }}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={{ ...typography.small, color: colors.textSecondary, flex: 1 }}>
              {t('text_entry.hint')}
            </Text>
          </View>

          {/* Text input */}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('text_entry.placeholder')}
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={500}
            autoFocus
            style={{
              minHeight: 120,
              fontSize: 16,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              borderRadius: RADIUS.lg,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: SPACING[4],
              paddingVertical: SPACING[3],
              textAlignVertical: 'top',
            }}
            accessibilityLabel={t('text_entry.placeholder')}
          />

          {/* Character count */}
          <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign: 'right' }}>
            {text.length}/500
          </Text>

          {/* Error */}
          {error && error !== 'NOT_FOOD' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2], padding: SPACING[3], backgroundColor: colors.errorSubtle, borderRadius: RADIUS.lg }}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={{ ...typography.small, color: colors.error, flex: 1 }}>
                {t('errors.analysis_failed')}
              </Text>
            </View>
          )}

          {error === 'NOT_FOOD' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2], padding: SPACING[3], backgroundColor: colors.errorSubtle, borderRadius: RADIUS.lg }}>
              <Ionicons name="alert-circle" size={20} color={colors.warning} />
              <Text style={{ ...typography.small, color: colors.warning, flex: 1 }}>
                {t('text_entry.not_food')}
              </Text>
            </View>
          )}

          {/* Examples */}
          {!isAnalyzing && !error && (
            <View style={{ gap: SPACING[2] }}>
              <Text style={{ ...typography.smallMedium, color: colors.textSecondary }}>
                {t('text_entry.examples_title')}
              </Text>
              {['text_entry.example_1', 'text_entry.example_2', 'text_entry.example_3'].map((key) => (
                <Pressable
                  key={key}
                  onPress={() => setText(t(key))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING[2],
                    paddingVertical: SPACING[2],
                    paddingHorizontal: SPACING[3],
                    backgroundColor: colors.surface,
                    borderRadius: RADIUS.md,
                    minHeight: MIN_TOUCH,
                  }}
                  accessibilityRole="button"
                >
                  <Text style={{ ...typography.small, color: colors.textSecondary }}>{t(key)}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Loading state */}
          {isAnalyzing && (
            <View style={{ alignItems: 'center', gap: SPACING[3], paddingVertical: SPACING[6] }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ ...typography.body, color: colors.textSecondary }}>
                {t('scan.analyzing')}
              </Text>
            </View>
          )}
        </View>

        {/* Analyze button */}
        <View style={{ padding: SPACING[4] }}>
          <Button
            title={t('text_entry.analyze')}
            onPress={handleAnalyze}
            disabled={!canAnalyze}
            loading={isAnalyzing}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
