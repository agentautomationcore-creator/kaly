import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert, Share, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { forwardIcon } from '../../../lib/rtl';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../lib/theme';
import { useProfile } from '../hooks/useProfile';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { GoalEditor } from './GoalEditor';
import { useAdaptiveGoals } from '../hooks/useAdaptiveGoals';
import { BodyEditor } from './BodyEditor';
import { DietEditor } from './DietEditor';
import { WeightLog } from './WeightLog';
import { SettingsSection } from './SettingsSection';
import { DeleteAccountButton } from './DeleteAccountButton';
import { ListSkeleton } from '../../../components/LoadingSkeleton';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import { exportReport } from '../../../lib/generateReport';
import { RADIUS, MIN_TOUCH, SPACING, SHADOW } from '../../../lib/constants';
import { typography } from '../../../lib/typography';

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
    <Card style={{ marginBottom: SPACING[3] }}>
      <Text accessibilityRole="header" style={{ ...typography.overline, color: colors.textTertiary, marginBottom: SPACING[2] }}>
        {t('profile.export_report').toUpperCase()}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING[3] }}>
        {[7, 30].map((d) => (
          <Pressable
            key={d}
            onPress={() => setSelectedPeriod(d)}
            accessibilityRole="button"
            accessibilityLabel={`${d} ${t('report.days')}`}
            style={{
              flex: 1,
              minHeight: MIN_TOUCH,
              paddingVertical: 8,
              borderRadius: RADIUS.full,
              backgroundColor: selectedPeriod === d ? colors.primarySubtle : colors.surface,
              borderWidth: 1.5,
              borderColor: selectedPeriod === d ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...typography.smallMedium, color: selectedPeriod === d ? colors.primary : colors.textSecondary }}>
              {d} {t('report.days')}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button title={t('profile.export_report')} onPress={handleExport} loading={isExporting} />
    </Card>
  );
}

function ProfileAvatar({ name, email }: { name?: string; email?: string }) {
  const colors = useColors();

  const initial = (name || email || '?')[0].toUpperCase();

  return (
    <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden' }}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ ...typography.h1, color: colors.textInverse }}>{initial}</Text>
      </LinearGradient>
    </View>
  );
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const { user, isAnonymous, signOut } = useAuthStore();
  const { lastRecalcDate, recalcNow } = useAdaptiveGoals();

  if (isLoading) return <ListSkeleton count={5} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: SPACING[4], paddingBottom: 100 }}
    >
      {/* Profile card */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: SPACING[6] }}>
        <ProfileAvatar name={profile?.display_name} email={user?.email} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.h2, color: colors.textPrimary }}>
            {profile?.display_name || t('profile.title')}
          </Text>
          {user?.email && (
            <Text style={{ ...typography.small, color: colors.textSecondary }}>{user.email}</Text>
          )}
          <Pressable onPress={() => router.push('/paywall')} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>
              {profile?.plan === 'pro' ? t('profile.pro_plan') : `${t('profile.free_plan')} \u2022 `}
            </Text>
            {profile?.plan !== 'pro' && (
              <Text style={{ ...typography.caption, color: colors.primary }}>{t('profile.upgrade')} {'\u2192'}</Text>
            )}
          </Pressable>
        </View>
        {profile?.plan === 'pro' && (
          <View style={{ backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm }}>
            <Text style={{ ...typography.caption, color: colors.textInverse, fontWeight: '700' }}>PRO</Text>
          </View>
        )}
      </View>

      {/* Anonymous banner */}
      {isAnonymous && (
        <Card style={{ marginBottom: SPACING[3], backgroundColor: colors.primarySubtle }}>
          <Text style={{ ...typography.small, color: colors.primary, marginBottom: SPACING[3] }}>
            {t('profile.save_data')}
          </Text>
          <Button title={t('profile.create_account')} onPress={() => router.push('/(auth)/register')} />
        </Card>
      )}

      {/* Daily target + adaptive goals */}
      {profile && (
        <Card style={{ marginBottom: SPACING[3], alignItems: 'center', gap: SPACING[2] }}>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            {t('profile.daily_target', { calories: profile.daily_calories })}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
            <Ionicons name="sync-outline" size={14} color={colors.textTertiary} />
            <Text style={{ ...typography.caption, color: colors.textTertiary }}>
              {lastRecalcDate
                ? t('profile.adaptive_last_update', { date: lastRecalcDate })
                : t('profile.adaptive_auto')}
            </Text>
          </View>
          <Pressable
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const newCal = await recalcNow();
              if (newCal) {
                Alert.alert(t('common.info'), t('profile.adaptive_updated', { calories: newCal }));
              } else {
                Alert.alert(t('common.info'), t('profile.adaptive_no_change'));
              }
            }}
            style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}
            accessibilityRole="button"
          >
            <Text style={{ ...typography.smallMedium, color: colors.primary }}>
              {t('profile.adaptive_recalc')}
            </Text>
          </Pressable>
        </Card>
      )}

      {/* Settings groups */}
      <Text style={{ ...typography.overline, color: colors.textTertiary, marginBottom: 8, marginTop: SPACING[4] }}>
        {t('profile.goals_section')}
      </Text>
      <GoalEditor profile={profile ?? null} />
      <BodyEditor profile={profile ?? null} />

      <Text style={{ ...typography.overline, color: colors.textTertiary, marginBottom: 8, marginTop: SPACING[4] }}>
        {t('profile.preferences_section')}
      </Text>
      <DietEditor profile={profile ?? null} />
      <WeightLog />
      <ExportReportCard />

      <Text style={{ ...typography.overline, color: colors.textTertiary, marginBottom: 8, marginTop: SPACING[4] }}>
        {t('profile.settings_section')}
      </Text>
      <SettingsSection profile={profile ?? null} />

      {/* Data export (GDPR Art. 20) */}
      <Text style={{ ...typography.overline, color: colors.textTertiary, marginBottom: 8, marginTop: SPACING[4] }}>
        {t('profile.privacy_section')}
      </Text>
      {!isAnonymous && (
        <Button
          title={t('profile.export_data')}
          variant="ghost"
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
          style={{ marginBottom: 8 }}
        />
      )}

      {/* Sign out */}
      {!isAnonymous && (
        <Button
          title={t('profile.sign_out')}
          variant="ghost"
          onPress={() => {
            Alert.alert(t('profile.sign_out'), '', [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('profile.sign_out'), onPress: signOut },
            ]);
          }}
          style={{ marginBottom: 8 }}
        />
      )}

      {/* Delete account */}
      <DeleteAccountButton />

      {/* Version */}
      <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: SPACING[6] }}>
        {t('profile.disclaimer')}
      </Text>
    </ScrollView>
  );
}
