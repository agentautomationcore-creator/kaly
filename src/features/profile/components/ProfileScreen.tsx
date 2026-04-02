import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
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
import { FONT_SIZE, RADIUS } from '../../../lib/constants';

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
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
    >
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 20 }}>
        {t('profile.title')}
      </Text>

      {/* Anonymous banner */}
      {isAnonymous && (
        <Card style={{ marginBottom: 16, backgroundColor: colors.primaryLight }}>
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, fontWeight: '500', marginBottom: 12 }}>
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
      <Pressable onPress={() => router.push('/paywall')}>
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
                const res = await fetch(
                  `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/export-data`,
                  {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    signal: controller.signal,
                  }
                );
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
          style={{ marginTop: 12 }}
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
          style={{ marginTop: 16 }}
        />
      )}

      {/* Delete account */}
      <DeleteAccountButton />

      {/* Disclaimer */}
      <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 24, lineHeight: 16 }}>
        {t('profile.disclaimer')}
      </Text>
    </ScrollView>
  );
}
