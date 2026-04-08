import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert, Share, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '../../../lib/theme';
import { useProfile } from '../hooks/useProfile';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { GoalEditor } from './GoalEditor';
import { BodyEditor } from './BodyEditor';
import { DietEditor } from './DietEditor';
import { WeightLog } from './WeightLog';
import { SettingsSection } from './SettingsSection';
import { DeleteAccountButton } from './DeleteAccountButton';
import { ListSkeleton } from '../../../components/LoadingSkeleton';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import { exportReport } from '../../../lib/generateReport';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';

function ExportReportCard() {
  const { t } = useTranslation();
  const colors = useColors();
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await exportReport(selectedPeriod);
      track('report_exported', { days: selectedPeriod });
    } catch (e) {
      Alert.alert(t('common.error'), t('errors.generic'));
      captureException(e, { feature: 'pdf_export' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card style={{ marginBottom: SPACING.lg }}>
      <Text accessibilityRole="header" style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: SPACING.sm }}>
        {t('profile.export_report')}
      </Text>
      <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
        {[7, 30].map((d) => (
          <Pressable
            key={d}
            onPress={() => setSelectedPeriod(d)}
            accessibilityRole="button"
            accessibilityLabel={`${d} ${t('report.days')}`}
            style={{
              flex: 1,
              minHeight: MIN_TOUCH,
              paddingVertical: SPACING.sm,
              borderRadius: RADIUS.md,
              backgroundColor: selectedPeriod === d ? colors.primaryLight : colors.surface,
              borderWidth: 1.5,
              borderColor: selectedPeriod === d ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '600', color: selectedPeriod === d ? colors.primary : colors.textSecondary }}>
              {d} {t('report.days')}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={handleExport}
        disabled={isExporting}
        accessibilityRole="button"
        accessibilityLabel={t('profile.export_report')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
          minHeight: MIN_TOUCH,
          backgroundColor: colors.primary,
          borderRadius: RADIUS.md,
          paddingVertical: SPACING.sm,
          opacity: isExporting ? 0.6 : 1,
        }}
      >
        {isExporting ? (
          <ActivityIndicator color={colors.card} size="small" />
        ) : (
          <Ionicons name="document-text-outline" size={20} color={colors.card} />
        )}
        <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.card }}>
          {t('profile.export_report')}
        </Text>
      </Pressable>
    </Card>
  );
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const { user, isAnonymous, signOut } = useAuthStore();

  if (isLoading) return <ListSkeleton count={5} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 20 }}>
        <Text accessibilityRole="header" style={{ fontSize: FONT_SIZE.xxl, fontWeight: '800', color: colors.text }}>
          {t('profile.title')}
        </Text>
        {profile?.plan === 'pro' && (
          <View style={{ backgroundColor: colors.primary, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm }}>
            <Text style={{ color: colors.textOnPrimary, fontSize: FONT_SIZE.xxs, fontWeight: '700' }}>PRO</Text>
          </View>
        )}
      </View>

      {/* Anonymous banner */}
      {isAnonymous && (
        <Card style={{ marginBottom: 16, backgroundColor: colors.primaryLight }}>
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, fontWeight: '500', marginBottom: SPACING.md }}>
            {t('profile.save_data')}
          </Text>
          <Button
            title={t('profile.create_account')}
            onPress={() => router.push('/(auth)/register')}
            variant="primary"
          />
        </Card>
      )}

      {/* Daily target */}
      {profile && (
        <Card style={{ marginBottom: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: FONT_SIZE.md, color: colors.textSecondary }}>
            {t('profile.daily_target', { calories: profile.daily_calories })}
          </Text>
        </Card>
      )}

      {/* Subscription */}
      <Pressable onPress={() => router.push('/paywall')} accessibilityRole="button" accessibilityLabel={t('profile.subscription')} style={{ minHeight: MIN_TOUCH }}>
        <Card style={{ marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
              {t('profile.subscription')}
            </Text>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>
              {profile?.plan === 'pro' ? t('profile.pro_plan') : t('profile.free_plan')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Card>
      </Pressable>

      {/* Goal */}
      <GoalEditor profile={profile ?? null} />

      {/* Body stats */}
      <BodyEditor profile={profile ?? null} />

      {/* Diet */}
      <DietEditor profile={profile ?? null} />

      {/* Weight log */}
      <WeightLog />

      {/* PDF Export */}
      <ExportReportCard />

      {/* Settings */}
      <SettingsSection profile={profile ?? null} />

      {/* Data export (GDPR Art. 20) */}
      {!isAnonymous && (
        <Button
          title={t('profile.export_data')}
          variant="outline"
          onPress={async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 30000);
              let json: string;
              try {
                const makeReq = async (token: string) => fetch(
                  `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/export-data`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                  }
                );

                let res = await makeReq(session.access_token);

                if (res.status === 401) {
                  await supabase.auth.refreshSession();
                  const { data: { session: refreshed } } = await supabase.auth.getSession();
                  if (refreshed) {
                    res = await makeReq(refreshed.access_token);
                  }
                }

                if (!res.ok) throw new Error('Export failed');
                json = await res.text();
              } finally {
                clearTimeout(timeout);
              }
              track('data_exported');
              await Share.share({ message: json, title: t('profile.export_share_title') });
            } catch (e) {
              Alert.alert(t('common.error'), t('errors.generic'));
              captureException(e, { feature: 'data_export' });
            }
          }}
          style={{ marginTop: SPACING.md }}
        />
      )}

      {/* Sign out */}
      {!isAnonymous && (
        <Button
          title={t('profile.sign_out')}
          variant="outline"
          onPress={() => {
            Alert.alert(t('profile.sign_out'), '', [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('profile.sign_out'), onPress: signOut },
            ]);
          }}
          style={{ marginTop: SPACING.lg }}
        />
      )}

      {/* Delete account */}
      <DeleteAccountButton />

      {/* Disclaimer */}
      <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.xl, lineHeight: 16 }}>
        {t('profile.disclaimer')}
      </Text>
    </ScrollView>
  );
}
