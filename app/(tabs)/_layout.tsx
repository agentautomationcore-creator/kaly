import React, { useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../src/lib/theme';
import { RADIUS, SHADOW } from '../../src/lib/constants';
import { typography } from '../../src/lib/typography';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { BottomSheet } from '../../src/components/BottomSheet';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ScanFAB() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const scale = useSharedValue(1);
  const [showSheet, setShowSheet] = React.useState(false);

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

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    router.push('/(tabs)/scan');
  }, [router]);

  const handleLongPress = useCallback(() => {
    setShowSheet(true);
  }, []);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);

  return (
    <View>
      <AnimatedPressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          {
            width: 56,
            height: 56,
            borderRadius: RADIUS['2xl'],
            marginBottom: 16,
            ...SHADOW.glow,
            overflow: 'hidden',
          },
          animStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('scan.scan_food')}
        accessibilityHint={t('hints.fab_scan')}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={{ width: 56, height: 56, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </AnimatedPressable>

      {showBadge && (
        <View style={{
          position: 'absolute',
          top: -4,
          end: -8,
          backgroundColor: scanLimit.used >= scanLimit.limit ? colors.error : colors.success,
          borderRadius: RADIUS.sm,
          paddingHorizontal: 6,
          paddingVertical: 2,
          minWidth: 28,
          alignItems: 'center',
        }}>
          <Text style={{ ...typography.caption, color: colors.textInverse, fontWeight: '700', fontSize: 10 }}>
            {scanLimit.limit - scanLimit.used}/{scanLimit.limit}
          </Text>
        </View>
      )}

      <BottomSheet visible={showSheet} onClose={() => setShowSheet(false)} snapPoints={[0.35]}>
        <View style={{ padding: 20, gap: 12 }}>
          {[
            { icon: 'camera-outline' as const, label: t('scan.take_photo'), hint: t('hints.open_camera'), route: '/(tabs)/scan' },
            { icon: 'barcode-outline' as const, label: t('barcode.scan_barcode'), hint: t('hints.open_barcode'), route: '/barcode' },
            { icon: 'search-outline' as const, label: t('food_search.placeholder'), hint: t('hints.open_search'), route: '/food-search' },
            { icon: 'create-outline' as const, label: t('food_search.enter_manually'), hint: t('hints.open_manual'), route: '/manual-entry' },
          ].map((item) => (
            <Pressable
              key={item.route}
              onPress={() => { setShowSheet(false); setTimeout(() => router.push(item.route as any), 200); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, minHeight: 44 }}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityHint={item.hint}
            >
              <Ionicons name={item.icon} size={22} color={colors.primary} />
              <Text style={{ ...typography.bodyMedium, color: colors.textPrimary }}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
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
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 83 : 64,
          paddingBottom: Platform.OS === 'ios' ? 34 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="diary"
        options={{
          title: t('tabs.diary'),
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('tabs.stats'),
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={24} color={color} />,
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
        name="fasting"
        options={{
          title: t('tabs.fasting'),
          tabBarIcon: ({ color, size }) => <Ionicons name="timer-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
