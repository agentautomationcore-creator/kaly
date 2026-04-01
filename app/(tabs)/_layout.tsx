import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../src/lib/theme';
import { useRouter } from 'expo-router';

function ScanFAB() {
  const colors = useColors();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/scan')}
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
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
      accessibilityLabel="Scan food"
    >
      <Ionicons name="camera" size={28} color={colors.card} />
    </Pressable>
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
          fontSize: 11,
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
