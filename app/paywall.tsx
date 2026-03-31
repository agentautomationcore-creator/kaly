import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../src/lib/theme';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { FONT_SIZE, RADIUS } from '../src/lib/constants';

type PlanPeriod = 'monthly' | 'annual';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const [period, setPeriod] = useState<PlanPeriod>('monthly');

  const handlePurchase = async () => {
    // TODO: RevenueCat purchase flow
    // For now, just go back
    router.back();
  };

  const handleRestore = async () => {
    // TODO: RevenueCat restore
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        {/* Close button */}
        <Pressable onPress={() => router.back()} style={{ alignSelf: 'flex-end', padding: 8 }}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>

        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
          {t('paywall.title')}
        </Text>

        {/* Free vs Pro comparison */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 24 }}>
          {/* Free */}
          <Card style={{ flex: 1, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
              {t('paywall.free_title')}
            </Text>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, lineHeight: 20 }}>
              {t('paywall.free_desc')}
            </Text>
          </Card>

          {/* Pro */}
          <Card style={{ flex: 1, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryLight }}>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '700', color: colors.primary, marginBottom: 8 }}>
              {t('paywall.pro_title')}
            </Text>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.text, lineHeight: 20 }}>
              {t('paywall.pro_desc')}
            </Text>
          </Card>
        </View>

        {/* Period toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: 4, marginBottom: 24 }}>
          <Pressable
            onPress={() => setPeriod('monthly')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: RADIUS.md,
              backgroundColor: period === 'monthly' ? colors.card : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '600', color: period === 'monthly' ? colors.text : colors.textSecondary }}>
              {t('paywall.monthly')}
            </Text>
            <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '700', color: period === 'monthly' ? colors.primary : colors.textSecondary, marginTop: 4 }}>
              {t('paywall.monthly_price')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setPeriod('annual')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: RADIUS.md,
              backgroundColor: period === 'annual' ? colors.card : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '600', color: period === 'annual' ? colors.text : colors.textSecondary }}>
              {t('paywall.annual')}
            </Text>
            <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '700', color: period === 'annual' ? colors.primary : colors.textSecondary, marginTop: 4 }}>
              {t('paywall.annual_price')}
            </Text>
            <View style={{ backgroundColor: colors.success, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#FFF' }}>{t('paywall.annual_savings')}</Text>
            </View>
          </Pressable>
        </View>

        {/* Trial CTA */}
        <Button title={t('paywall.trial_cta')} onPress={handlePurchase} />

        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
          {t('paywall.trial_note')}
        </Text>

        {/* Continue free */}
        <Pressable onPress={() => router.back()} style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{t('paywall.continue_free')}</Text>
        </Pressable>

        {/* Restore + links */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24 }}>
          <Pressable onPress={handleRestore}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('paywall.restore')}</Text>
          </Pressable>
          <Text style={{ fontSize: 12, color: colors.border }}>|</Text>
          <Pressable>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('paywall.terms')}</Text>
          </Pressable>
          <Text style={{ fontSize: 12, color: colors.border }}>|</Text>
          <Pressable>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('paywall.privacy')}</Text>
          </Pressable>
        </View>

        <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 16 }}>
          {t('paywall.cancel_anytime')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
