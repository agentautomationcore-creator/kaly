import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '../../src/lib/theme';
import { FONT_SIZE, RADIUS, SPACING } from '../../src/lib/constants';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';

function ScanFAB() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: scanLimit } = useQuery({
    queryKey: ['scanLimit'],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.rpc('check_daily_scan_limit', { p_user_id: user.id });
      return data as { allowed: boolean; used: number; limit: number; plan: string } | null;
    },
    staleTime: 60000,
    enabled: !!user,
  });

  const showBadge = scanLimit && scanLimit.plan !== 'pro';

  return (
    <View>
      <Pressable
        onPress={() => router.push('/(tabs)/scan')}
        style={{
          width: 56,
          height: 56,
          borderRadius: RADIUS.full,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: Platform.OS === 'ios' ? 20 : 8,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        accessibilityRole="button"
        accessibilityLabel={t('scan.scan_food')}
      >
        <Ionicons name="camera" size={28} color={colors.card} />
      </Pressable>
      {showBadge && (
        <View style={{
          position: 'absolute',
          top: -4,
          end: -8,
          backgroundColor: scanLimit.used >= scanLimit.limit ? colors.danger : colors.success,
          borderRadius: RADIUS.sm,
          paddingHorizontal: 6,
          paddingVertical: 2,
          minWidth: 28,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: FONT_SIZE.xxs, fontWeight: '700', color: colors.textOnPrimary }}>
            {scanLimit.limit - scanLimit.used}/{scanLimit.limit}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="diary"
        options={{
          title: t('tabs.diary'),
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: '',
          tabBarIcon: () => <ScanFAB />,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('tabs.stats'),
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
