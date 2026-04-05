import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useColors } from '../../../lib/theme';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';
import { useScanStore } from '../store/scanStore';
import { useAnalyzeFood } from '../hooks/useAnalyzeFood';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { ConsentModal } from '../../../components/ConsentModal';
import { ScanCamera } from './ScanCamera';
import { ScanLoading } from './ScanLoading';
import { NutritionResultCard } from './NutritionResultCard';

export function ScanScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { photo, result, isAnalyzing, error, reset, setError } = useScanStore();
  const { mutate: analyze } = useAnalyzeFood();
  const aiConsentGiven = useSettingsStore((s) => s.aiConsentGiven);
  const healthConsentGiven = useSettingsStore((s) => s.healthConsentGiven);
  const setAiConsent = useSettingsStore((s) => s.setAiConsent);
  const setHealthConsent = useSettingsStore((s) => s.setHealthConsent);
  const [consentStep, setConsentStep] = useState<'health' | 'ai' | null>(
    !healthConsentGiven ? 'health' : !aiConsentGiven ? 'ai' : null
  );
  const [consentDeclined, setConsentDeclined] = useState(false);

  // Consent declined — show informative screen instead of camera
  if (consentDeclined && !result && !isAnalyzing && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.textTertiary} />
        <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: '600', color: colors.text, marginTop: SPACING.lg, textAlign: 'center' }}>
          {t('scan.consent_required_title')}
        </Text>
        <Text style={{ fontSize: FONT_SIZE.md, color: colors.textSecondary, marginTop: SPACING.sm, textAlign: 'center' }}>
          {t('scan.consent_required_desc')}
        </Text>
        <Pressable
          onPress={() => router.push('/food-search')}
          style={{ minHeight: MIN_TOUCH, marginTop: SPACING.xl, justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel={t('food_search.placeholder')}
        >
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: FONT_SIZE.md }}>{t('food_search.placeholder')}</Text>
        </Pressable>
        <Pressable
          onPress={() => { setConsentDeclined(false); setConsentStep(!healthConsentGiven ? 'health' : 'ai'); }}
          style={{ minHeight: MIN_TOUCH, marginTop: SPACING.sm, justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel={t('scan.enable_ai')}
        >
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: FONT_SIZE.md }}>{t('scan.enable_ai')}</Text>
        </Pressable>
      </View>
    );
  }

  // GDPR: Show health consent first, then AI consent — server requires both
  if (consentStep && !result && !isAnalyzing && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScanCamera />
        <ConsentModal
          visible
          type={consentStep}
          onAccept={async () => {
            const user = useAuthStore.getState().user;
            if (consentStep === 'health') {
              setHealthConsent(true);
              if (user) {
                await supabase.from('nutrition_profiles').update({
                  health_consent_given: true,
                  health_consent_at: new Date().toISOString(),
                }).eq('id', user.id);
              }
              // Move to AI consent if not yet given
              setConsentStep(!aiConsentGiven ? 'ai' : null);
            } else {
              setAiConsent(true);
              if (user) {
                await supabase.from('nutrition_profiles').update({
                  ai_consent_given: true,
                  ai_consent_at: new Date().toISOString(),
                }).eq('id', user.id);
              }
              setConsentStep(null);
            }
          }}
          onDecline={() => {
            setConsentStep(null);
            setConsentDeclined(true);
          }}
        />
      </View>
    );
  }

  if (isAnalyzing) {
    return <ScanLoading />;
  }

  if (error && !result) {
    const isRateLimit = error === 'RATE_LIMIT';
    const isNotFood = error === 'NOT_FOOD' || (typeof error === 'string' && error.includes('not_food'));
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }}>
        <Text style={{ color: colors.danger, fontSize: FONT_SIZE.lg, fontWeight: '600', marginBottom: SPACING.md }}>
          {isRateLimit ? t('scan.scan_limit', { limit: 3 }) : isNotFood ? t('scan.not_food_detected') : t('errors.analysis_failed')}
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: SPACING.xl }}>
          {isRateLimit ? t('scan.upgrade_for_more') : isNotFood ? t('scan.not_food_hint') : t('errors.generic')}
        </Text>
        {isRateLimit && (
          <>
            <Pressable
              onPress={() => router.push('/paywall')}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: SPACING.xl,
                paddingVertical: SPACING.md,
                borderRadius: RADIUS.md,
                minHeight: MIN_TOUCH,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: SPACING.md,
              }}
              accessibilityRole="button"
              accessibilityLabel={t('scan.upgrade_button')}
            >
              <Text style={{ color: colors.card, fontWeight: '600', fontSize: FONT_SIZE.lg }}>
                {t('scan.upgrade_button')}
              </Text>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg }}>
              <Pressable
                onPress={() => { reset(); router.push('/(tabs)/diary'); }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surface, paddingVertical: SPACING.md, borderRadius: RADIUS.md, minHeight: MIN_TOUCH }}
                accessibilityRole="button"
                accessibilityLabel={t('scan.use_barcode')}
              >
                <Ionicons name="barcode-outline" size={20} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: '500' }}>{t('scan.use_barcode')}</Text>
              </Pressable>
              <Pressable
                onPress={() => { reset(); router.push('/(tabs)/diary'); }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surface, paddingVertical: SPACING.md, borderRadius: RADIUS.md, minHeight: MIN_TOUCH }}
                accessibilityRole="button"
                accessibilityLabel={t('scan.enter_manually')}
              >
                <Ionicons name="create-outline" size={20} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: '500' }}>{t('scan.enter_manually')}</Text>
              </Pressable>
            </View>
          </>
        )}
        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          {!isRateLimit && photo && (
            <Pressable
              onPress={() => { setError(null); analyze(photo); }}
              style={{ backgroundColor: colors.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.md, minHeight: MIN_TOUCH, justifyContent: 'center' }}
              accessibilityRole="button"
              accessibilityLabel={t('common.retry')}
            >
              <Text style={{ color: colors.card, fontWeight: '600' }}>{t('common.retry')}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={reset}
            style={{ backgroundColor: colors.surface, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.md, minHeight: MIN_TOUCH, justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (result) {
    return <NutritionResultCard />;
  }

  return <ScanCamera />;
}
