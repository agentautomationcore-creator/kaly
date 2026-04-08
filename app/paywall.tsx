import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import { useColors } from '../src/lib/theme';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../src/lib/constants';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/lib/supabase';
import { captureException } from '../src/lib/sentry';
import { track } from '../src/lib/analytics';

type PlanPeriod = 'monthly' | 'annual';

const TERMS_URL = 'https://kaly.app/terms';
const PRIVACY_URL = 'https://kaly.app/privacy';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<PlanPeriod>('monthly');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    track('paywall_shown');
  }, []);

  useEffect(() => {
    async function loadOfferings() {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current?.availablePackages) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (err: unknown) {
        if (__DEV__) console.error('Failed to load offerings:', err);
        captureException(err, { feature: 'paywall_load_offerings' });
      }
    }
    loadOfferings();
  }, []);

  /** Sync RevenueCat entitlements → Zustand + DB fallback (primary sync via RevenueCat webhook) */
  const syncPlanFromCustomerInfo = async (customerInfo: CustomerInfo) => {
    const isPro = !!customerInfo.entitlements.active['pro'];
    const newPlan = isPro ? 'pro' : 'free';
    const profile = useAuthStore.getState().profile;
    if (profile) {
      useAuthStore.getState().setProfile({ ...profile, plan: newPlan });
    }
    // Server sync fallback (SEC-8) — webhook delay guard for DB consistency
    if (user) {
      try {
        await supabase.rpc('sync_plan_from_purchase', {
          p_plan: newPlan,
          p_source: 'client_purchase',
        });
      } catch (err) {
        // Non-blocking — webhook will eventually sync
        captureException(err, { feature: 'paywall_sync_fallback' });
      }
    }
  };

  // Require account before purchasing
  const handlePurchase = async () => {
    const isAnonymous = useAuthStore.getState().isAnonymous;
    if (isAnonymous) {
      Alert.alert(
        t('auth.create_account'),
        t('profile.save_data'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.create_account'), onPress: () => router.replace('/(auth)/register') },
        ]
      );
      return;
    }
    // Network check (B13) before payment flow
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      Alert.alert(t('common.error'), t('errors.network'));
      return;
    }

    const pkg = packages.find((p) =>
      period === 'annual'
        ? p.packageType === 'ANNUAL'
        : p.packageType === 'MONTHLY'
    );
    if (!pkg) {
      Alert.alert(t('common.error'), t('paywall.store_unavailable'));
      return;
    }

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

  // Restore and sync entitlements to DB
  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      // Check entitlement BEFORE syncing to DB — prevents giving Pro to non-subscribers
      if (customerInfo.entitlements.active['pro']) {
        await syncPlanFromCustomerInfo(customerInfo);
        Alert.alert(t('paywall.restored'), t('paywall.restored_desc'));
        router.back();
      } else {
        Alert.alert(t('common.info'), t('paywall.no_purchases'));
      }
    } catch (err: unknown) {
      Alert.alert(t('common.error'), t('paywall.restore_failed'));
      captureException(err, { feature: 'paywall_restore' });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 60 }}>
        {/* Close button */}
        <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/diary'); }} style={{ alignSelf: 'flex-end', padding: SPACING.sm, minHeight: MIN_TOUCH, minWidth: 44, justifyContent: 'center', alignItems: 'center' }} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>

        <Text style={{ fontSize: FONT_SIZE.xxl, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: SPACING.sm }}>
          {t('paywall.title')}
        </Text>

        {/* Free vs Pro comparison */}
        <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xl, marginBottom: SPACING.xl }}>
          {/* Free */}
          <Card style={{ flex: 1, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '700', color: colors.text, marginBottom: SPACING.sm }}>
              {t('paywall.free_title')}
            </Text>
            {t('paywall.free_desc').split('\n').map((line: string, i: number) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 4 }}>
                <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
                <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, flex: 1 }}>{line}</Text>
              </View>
            ))}
          </Card>

          {/* Pro */}
          <Card style={{ flex: 1, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryLight }}>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '700', color: colors.primary, marginBottom: SPACING.sm }}>
              {t('paywall.pro_title')}
            </Text>
            {t('paywall.pro_desc').split('\n').map((line: string, i: number) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 4 }}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={{ fontSize: FONT_SIZE.xs, color: colors.text, flex: 1 }}>{line}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Period toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: SPACING.xs, marginBottom: SPACING.xl }}>
          <Pressable
            onPress={() => setPeriod('monthly')}
            disabled={purchasing}
            accessibilityRole="button"
            accessibilityLabel={t('paywall.monthly')}
            style={{
              flex: 1,
              paddingVertical: SPACING.md,
              borderRadius: RADIUS.md,
              backgroundColor: period === 'monthly' ? colors.card : 'transparent',
              alignItems: 'center',
              opacity: purchasing ? 0.5 : 1,
            }}
          >
            <Text style={{ fontWeight: '600', color: period === 'monthly' ? colors.text : colors.textSecondary }}>
              {t('paywall.monthly')}
            </Text>
            <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '700', color: period === 'monthly' ? colors.primary : colors.textSecondary, marginTop: SPACING.xs }}>
              {t('paywall.monthly_price')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setPeriod('annual')}
            disabled={purchasing}
            accessibilityRole="radio"
            accessibilityLabel={t('paywall.annual')}
            style={{
              flex: 1,
              paddingVertical: SPACING.md,
              borderRadius: RADIUS.md,
              backgroundColor: period === 'annual' ? colors.card : 'transparent',
              alignItems: 'center',
              opacity: purchasing ? 0.5 : 1,
            }}
          >
            <Text style={{ fontWeight: '600', color: period === 'annual' ? colors.text : colors.textSecondary }}>
              {t('paywall.annual')}
            </Text>
            <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '700', color: period === 'annual' ? colors.primary : colors.textSecondary, marginTop: SPACING.xs }}>
              {t('paywall.annual_price')}
            </Text>
            <View style={{ backgroundColor: colors.success, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginTop: SPACING.xs }}>
              <Text style={{ fontSize: FONT_SIZE.xxs, fontWeight: '600', color: colors.card }}>{t('paywall.annual_savings')}</Text>
            </View>
          </Pressable>
        </View>

        {/* Trial CTA */}
        <Button title={t('paywall.trial_cta')} onPress={handlePurchase} loading={purchasing} />

        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.sm }}>
          {t('paywall.trial_note')}
        </Text>

        {/* Continue free */}
        <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/diary'); }} style={{ alignItems: 'center', marginTop: 20, minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={t('paywall.continue_free')}>
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{t('paywall.continue_free')}</Text>
        </Pressable>

        {/* Restore + links */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.lg, marginTop: SPACING.xl }}>
          <Pressable onPress={handleRestore} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={t('paywall.restore')}>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>{t('paywall.restore')}</Text>
          </Pressable>
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.border }}>|</Text>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="link" accessibilityLabel={t('paywall.terms')}>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>{t('paywall.terms')}</Text>
          </Pressable>
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.border }}>|</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="link" accessibilityLabel={t('paywall.privacy')}>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>{t('paywall.privacy')}</Text>
          </Pressable>
        </View>

        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.lg, lineHeight: 16 }}>
          {t('paywall.auto_renewal_disclosure')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
