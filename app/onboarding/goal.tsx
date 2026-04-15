import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, AccessibilityInfo } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { IconButton } from '../../src/components/IconButton';
import { OptionCard } from '../../src/components/OptionCard';
import { SPACING, MIN_TOUCH } from '../../src/lib/constants';
import { typography } from '../../src/lib/typography';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { captureException } from '../../src/lib/sentry';
import type { Goal } from '../../src/lib/nutrition';

const GOALS = [
  { key: 'lose', icon: '\uD83D\uDCC9', desc: '' },
  { key: 'maintain', icon: '\u2696\uFE0F', desc: '' },
  { key: 'gain', icon: '\uD83D\uDCC8', desc: '' },
];

function ProgressSegments({ total, current }: { total: number; current: number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 4, marginBottom: SPACING[6] }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < current ? colors.primary : colors.border }} />
      ))}
    </View>
  );
}

export default function GoalScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const setGoal = useOnboardingStore((s) => s.setGoal);
  const signInAnonymously = useAuthStore((s) => s.signInAnonymously);
  const [selected, setSelected] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); }, []);

  // Reset navigating lock when screen regains focus (e.g. swipe back)
  useFocusEffect(useCallback(() => {
    setNavigating(false);
  }, []));

  const handleSelect = (key: string) => {
    if (navigating) return;
    setSelected(key);
    setGoal(key as Goal);
    setNavigating(true);
    setTimeout(() => {
      router.push('/onboarding/body');
    }, 350);
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      const { data: { user: existingUser } } = await supabase.auth.getUser();
      if (!existingUser) {
        await signInAnonymously();
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('nutrition_profiles').upsert({
          id: user.id,
          goal: 'maintain',
          daily_calories: 2000,
          protein_pct: 30,
          carbs_pct: 45,
          fat_pct: 25,
          onboarding_done: true,
        });
      }
      router.replace('/(tabs)/diary');
    } catch (e) {
      captureException(e, { feature: 'onboarding_skip' });
    } finally {
      setSkipping(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: SPACING[6] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[4] }}>
        <IconButton icon="chevron-back" onPress={() => router.back()} accessibilityLabel={t('common.back')} />
      </View>

      <ProgressSegments total={4} current={1} />

      <Animated.Text
        accessibilityRole="header"
        entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(100)}
        style={{ ...typography.title, color: colors.textPrimary, marginBottom: SPACING[2] }}
      >
        {t('onboarding.goal_title')}
      </Animated.Text>

      <View style={{ flex: 1, justifyContent: 'center', gap: SPACING[3] }}>
        {GOALS.map((g) => (
          <OptionCard
            key={g.key}
            icon={g.icon}
            title={t(`onboarding.goal_${g.key}`)}
            selected={selected === g.key}
            onPress={() => handleSelect(g.key)}
          />
        ))}
      </View>

      <View style={{ gap: SPACING[3] }}>
        <Button title={t('onboarding.skip')} variant="ghost" onPress={handleSkip} disabled={skipping} loading={skipping} />
      </View>
    </SafeAreaView>
  );
}
