import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { FONT_SIZE, RADIUS } from '../../src/lib/constants';
import { Ionicons } from '@expo/vector-icons';

const GOALS = [
  { key: 'lose', icon: 'trending-down' as const },
  { key: 'maintain', icon: 'remove' as const },
  { key: 'gain', icon: 'trending-up' as const },
];

export default function GoalScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
        {t('onboarding.goal_title')}
      </Text>

      <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
        {GOALS.map((g) => (
          <Pressable
            key={g.key}
            onPress={() => setSelected(g.key)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: RADIUS.lg,
              backgroundColor: selected === g.key ? colors.primaryLight : colors.card,
              borderWidth: 2,
              borderColor: selected === g.key ? colors.primary : 'transparent',
              gap: 16,
            }}
          >
            <Ionicons name={g.icon} size={24} color={selected === g.key ? colors.primary : colors.textSecondary} />
            <Text
              style={{
                fontSize: FONT_SIZE.md,
                fontWeight: '600',
                color: selected === g.key ? colors.primary : colors.text,
              }}
            >
              {t(`onboarding.goal_${g.key}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        title={t('onboarding.next')}
        onPress={() => router.push('/onboarding/body')}
        disabled={!selected}
      />
    </SafeAreaView>
  );
}
