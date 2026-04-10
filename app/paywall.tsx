import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Linking, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import { useColors } from '../src/lib/theme';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { RADIUS, MIN_TOUCH, SPACING, SHADOW } from '../src/lib/constants';
import { typography } from '../src/lib/typography';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/lib/supabase';
import { captureException } from '../src/lib/sentry';
import { track } from '../src/lib/analytics';

type PlanPeriod = 'monthly' | 'annual';
const TERMS_URL = 'https://doclear.app/kaly-terms';
const PRIVACY_URL = 'https://doclear.app/kaly-privacy';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<PlanPeriod>('annual');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => { track('paywall_shown'); }, []);

  useEffect(() => {
    async function loadOfferings() {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current?.availablePackages) setPackages(offerings.current.availablePackages);
      } catch (err) {
        captureException(err, { feature: 'paywall_load_offerings' });
      }
    }
    loadOfferings();
  }, []);

  const syncPlanFromCustomerInfo = async (customerInfo: CustomerInfo) => {
    const isPro = !!customerInfo.entitlements.active['pro'];
    const newPlan = isPro ? 'pro' : 'free';
    const profile = useAuthStore.getState().profile;
    if (profile) useAuthStore.getState().setProfile({ ...profile, plan: newPlan });
    if (user) {
      try {
        await supabase.rpc('sync_plan_from_purchase', { p_plan: newPlan, p_source: 'client_purchase' });
      } catch (err) {
        captureException(err, { feature: 'paywall_sync_fallback' });
      }
    }
  };

  const handlePurchase = async () => {
    const isAnonymous = useAuthStore.getState().isAnonymous;
    if (isAnonymous) {
      Alert.alert(t('auth.create_account'), t('profile.save_data'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.create_account'), onPress: () => router.replace('/(auth)/register') },
      ]);
      return;
    }
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) { Alert.alert(t('common.error'), t('errors.network')); return; }

    const pkg = packages.find((p) => period === 'annual' ? p.packageType === 'ANNUAL' : p.packageType === 'MONTHLY');
    if (!pkg) { Alert.alert(t('common.error'), t('paywall.store_unavailable')); return; }

    setPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['pro']) {
        await syncPlanFromCustomerInfo(customerInfo);
        track('subscription_started', { period });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('paywall.purchase_success_title'), t('paywall.purchase_success'));
        router.back();
      }
    } catch (err: unknown) {
      if (err instanceof Error && !err.message.includes('cancelled')) {
        Alert.alert(t('common.error'), t('paywall.purchase_failed'));
        captureException(err, { feature: 'paywall_purchase', period });
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['pro']) {
        await syncPlanFromCustomerInfo(customerInfo);
        Alert.alert(t('paywall.restored'), t('paywall.restored_desc'));
        router.back();
      } else {
        Alert.alert(t('common.info'), t('paywall.no_purchases'));
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('paywall.restore_failed'));
      captureException(err, { feature: 'paywall_restore' });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: SPACING[6], paddingBottom: 60 }}>
        {/* Close — ALWAYS visible, normal size */}
        <Pressable
          onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/diary'); }}
          style={{ alignSelf: 'flex-end', padding: 8, minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, justifyContent: 'center', alignItems: 'center' }}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </Pressable>

        {/* Title */}
        <Text style={{ ...typography.title, color: colors.textPrimary, textAlign: 'center', marginBottom: SPACING[6] }}>
          {t('paywall.title')}
        </Text>

        {/* Comparison: Free vs Pro */}
        <View style={{ flexDirection: 'row', gap: SPACING[3], marginBottom: SPACING[6] }}>
          <Card style={{ flex: 1 }}>
            <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: SPACING[2] }}>{t('paywall.free_title')}</Text>
            {t('paywall.free_desc').split('\n').map((line: string, i: number) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="lock-closed" size={12} color={colors.textTertiary} />
                <Text style={{ ...typography.caption, color: colors.textSecondary, flex: 1 }}>{line}</Text>
              </View>
            ))}
          </Card>
          <Card style={{ flex: 1, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primarySubtle }}>
            <Text style={{ ...typography.bodyMedium, color: colors.primary, marginBottom: SPACING[2] }}>{t('paywall.pro_title')}</Text>
            {t('paywall.pro_desc').split('\n').map((line: string, i: number) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1, fontWeight: '600' }}>{line}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Plan cards — side by side, annual selected by default */}
        <View style={{ flexDirection: 'row', gap: SPACING[3], marginBottom: SPACING[6] }}>
          {(['monthly', 'annual'] as PlanPeriod[]).map((p) => {
            const isSelected = period === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                disabled={purchasing}
                accessibilityRole="radio"
                accessibilityLabel={t(`paywall.${p}`)}
                style={{
                  flex: 1,
                  paddingVertical: SPACING[4],
                  borderRadius: RADIUS.lg,
                  backgroundColor: isSelected ? colors.surfaceElevated : colors.surface,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.primary : colors.border,
                  alignItems: 'center',
                  ...(isSelected ? SHADOW.sm : {}),
                }}
              >
                <Text style={{ ...typography.bodyMedium, color: isSelected ? colors.textPrimary : colors.textSecondary }}>
                  {t(`paywall.${p}`)}
                </Text>
                <Text style={{ ...typography.h2, color: isSelected ? colors.primary : colors.textSecondary, marginTop: 4 }}>
                  {t(`paywall.${p}_price`)}
                </Text>
                {p === 'annual' && (
                  <View style={{ backgroundColor: colors.primary, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 }}>
                    <Text style={{ ...typography.caption, color: colors.textInverse, fontWeight: '700' }}>{t('paywall.annual_savings')}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Trial CTA */}
        <Button
          title={`${t('paywall.trial_cta')} \u2192`}
          onPress={handlePurchase}
          loading={purchasing}
          gradient
        />

        <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: SPACING[2] }}>
          {t('paywall.trial_note', {
            price: packages.find((p) => period === 'annual' ? p.packageType === 'ANNUAL' : p.packageType === 'MONTHLY')?.product?.priceString ?? '',
          })}
        </Text>

        {/* Continue with free plan — VISIBLE, secondary */}
        <View style={{ marginTop: SPACING[4] }}>
          <Button
            title={t('paywall.continue_free')}
            variant="secondary"
            onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/diary'); }}
          />
        </View>

        {/* Restore + links */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING[4], marginTop: SPACING[6] }}>
          <Pressable onPress={handleRestore} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="button"><Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('paywall.restore')}</Text></Pressable>
          <Text style={{ ...typography.caption, color: colors.border }}>|</Text>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="link"><Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('paywall.terms')}</Text></Pressable>
          <Text style={{ ...typography.caption, color: colors.border }}>|</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="link"><Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('paywall.privacy')}</Text></Pressable>
        </View>

        <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: SPACING[4], lineHeight: 16 }}>
          {t('paywall.auto_renewal_disclosure')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
