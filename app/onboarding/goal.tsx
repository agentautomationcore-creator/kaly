import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, AccessibilityInfo } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { StepIndicator } from '../../src/components/StepIndicator';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../../src/lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { captureException } from '../../src/lib/sentry';
import type { Goal } from '../../src/lib/nutrition';

const GOALS = [
  { key: 'lose', icon: 'trending-down' as const },
  { key: 'maintain', icon: 'pause' as const },
  { key: 'gain', icon: 'trending-up' as const },
];

export default function GoalScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const setGoal = useOnboardingStore((s) => s.setGoal);
  const signInAnonymously = useAuthStore((s) => s.signInAnonymously);
  const [selected, setSelected] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); }, []);

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await signInAnonymously();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: SPACING.xl }}>
      <StepIndicator totalSteps={4} currentStep={2} />
      <Animated.Text entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(100)} style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text, marginBottom: SPACING.sm }}>
        {t('onboarding.goal_title')}
      </Animated.Text>

      <View style={{ flex: 1, justifyContent: 'center', gap: SPACING.md }}>
        {GOALS.map((g) => (
          <Pressable
            key={g.key}
            onPress={() => setSelected(g.key)}
            accessibilityRole="button"
            accessibilityLabel={t(`onboarding.goal_${g.key}`)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: SPACING.lg,
              minHeight: MIN_TOUCH,
              borderRadius: RADIUS.lg,
              backgroundColor: selected === g.key ? colors.primaryLight : colors.card,
              borderWidth: 2,
              borderColor: selected === g.key ? colors.primary : 'transparent',
              gap: SPACING.lg,
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

      <View style={{ gap: SPACING.md }}>
        <Button
          title={t('onboarding.next')}
          onPress={() => { if (selected) setGoal(selected as Goal); router.push('/onboarding/body'); }}
          disabled={!selected}
        />
        <Pressable
          onPress={handleSkip}
          disabled={skipping}
          style={{ alignItems: 'center', minHeight: MIN_TOUCH, justifyContent: 'center', opacity: skipping ? 0.5 : 1 }}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.skip')}
        >
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>
            {t('onboarding.skip')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
