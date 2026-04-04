import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useColors } from '../../../lib/theme';
import { FONT_SIZE } from '../../../lib/constants';
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
  const setAiConsent = useSettingsStore((s) => s.setAiConsent);
  const [showAiConsent, setShowAiConsent] = useState(false);

  // GDPR-1: Show AI consent modal on first scan attempt (non-blocking for barcode/manual)
  if (!aiConsentGiven && !result && !isAnalyzing && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScanCamera />
        <ConsentModal
          visible={!aiConsentGiven && !showAiConsent}
          type="ai"
          onAccept={async () => {
            setAiConsent(true);
            setShowAiConsent(false);
            const user = useAuthStore.getState().user;
            if (user) {
              await supabase.from('nutrition_profiles').update({
                ai_consent_given: true,
                ai_consent_at: new Date().toISOString(),
              }).eq('id', user.id);
            }
          }}
          onDecline={() => {
            // B14: Allow barcode/manual entry even without AI consent
            setShowAiConsent(true);
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
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: colors.danger, fontSize: FONT_SIZE.lg, fontWeight: '600', marginBottom: 12 }}>
          {isRateLimit ? t('scan.scan_limit', { limit: 3 }) : isNotFood ? t('scan.not_food_detected') : t('errors.analysis_failed')}
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          {isRateLimit ? t('scan.upgrade_for_more') : isNotFood ? t('scan.not_food_hint') : t('errors.generic')}
        </Text>
        {isRateLimit && (
          <Pressable
            onPress={() => router.push('/paywall')}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel={t('scan.upgrade_button')}
          >
            <Text style={{ color: colors.card, fontWeight: '600', fontSize: 16 }}>
              {t('scan.upgrade_button')}
            </Text>
          </Pressable>
        )}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {!isRateLimit && photo && (
            <Pressable
              onPress={() => { setError(null); analyze(photo); }}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minHeight: 44, justifyContent: 'center' }}
              accessibilityRole="button"
              accessibilityLabel={t('common.retry')}
            >
              <Text style={{ color: colors.card, fontWeight: '600' }}>{t('common.retry')}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={reset}
            style={{ backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minHeight: 44, justifyContent: 'center' }}
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
