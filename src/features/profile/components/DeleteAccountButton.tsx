import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Button';

export function DeleteAccountButton() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleDelete = () => {
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

            const response = await fetch(
              `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!response.ok) throw new Error('Delete failed');

            await signOut();
            router.replace('/onboarding/welcome');
          } catch (e) {
            Alert.alert(t('common.error'), t('errors.generic'));
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
