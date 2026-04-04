import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useColors } from '../../../lib/theme';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Button';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';

export function DeleteAccountButton() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t('profile.delete_account'), t('profile.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);
            try {
              const makeRequest = async (token: string) => fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  signal: controller.signal,
                }
              );

              let response = await makeRequest(session.access_token);

              if (response.status === 401) {
                await supabase.auth.refreshSession();
                const { data: { session: refreshed } } = await supabase.auth.getSession();
                if (refreshed) {
                  response = await makeRequest(refreshed.access_token);
                }
              }

              if (!response.ok) throw new Error('Delete failed');
            } finally {
              clearTimeout(timeout);
            }

            track('account_deleted');
            await signOut();
            router.replace('/onboarding/welcome');
          } catch (e) {
            Alert.alert(t('common.error'), t('errors.generic'));
            captureException(e, { feature: 'delete_account' });
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Button
      title={t('profile.delete_account')}
      variant="danger"
      onPress={handleDelete}
      loading={loading}
      style={{ marginTop: 24 }}
    />
  );
}
