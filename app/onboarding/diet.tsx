import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert, AccessibilityInfo } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { StepIndicator } from '../../src/components/StepIndicator';
import { FONT_SIZE, RADIUS } from '../../src/lib/constants';
import { useAuthStore } from '../../src/stores/authStore';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { supabase } from '../../src/lib/supabase';
import { captureException } from '../../src/lib/sentry';
import { track } from '../../src/lib/analytics';
import { calculateTDEE, calculateDailyTarget, calculateMacroSplit } from '../../src/lib/nutrition';
import type { Gender, ActivityLevel, Goal, DietType } from '../../src/lib/nutrition';
import * as Device from 'expo-device';

const DIETS = ['balanced', 'keto', 'vegan', 'vegetarian', 'paleo'] as const;
const ALLERGIES = ['gluten', 'dairy', 'nuts', 'shellfish', 'eggs', 'soy'] as const;

export default function DietScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const signInAnonymously = useAuthStore((s) => s.signInAnonymously);

  const [diet, setDiet] = useState('balanced');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); }, []);

  const toggleAllergy = (a: string) => {
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const handleDone = async () => {
    setLoading(true);
    try {
      // Sign in anonymously first
      await signInAnonymously();

      // Save profile with TDEE calculation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const ob = useOnboardingStore.getState();
        const deviceId = Device.modelId || Device.deviceName || 'unknown';

        // Calculate TDEE and macros from onboarding data
        let dailyCalories = 2000;
        let proteinPct = 30;
        let carbsPct = 40;
        let fatPct = 30;

        if (ob.weightKg && ob.heightCm && ob.age && ob.gender) {
          const tdee = calculateTDEE(ob.weightKg, ob.heightCm, ob.age, ob.gender, ob.activityLevel);
          dailyCalories = calculateDailyTarget(tdee, ob.goal || 'maintain');
          const dietKey = diet as DietType;
          const macros = calculateMacroSplit(dailyCalories, dietKey);
          proteinPct = Math.round((macros.protein_g * 4 / dailyCalories) * 100);
          carbsPct = Math.round((macros.carbs_g * 4 / dailyCalories) * 100);
          fatPct = 100 - proteinPct - carbsPct;
        }

        await supabase.from('nutrition_profiles').upsert({
          id: user.id,
          diet_type: diet,
          allergies,
          onboarding_done: true,
          display_name: deviceId,
          goal: ob.goal || 'maintain',
          height_cm: ob.heightCm,
          weight_kg: ob.weightKg,
          age: ob.age,
          gender: ob.gender,
          activity_level: ob.activityLevel,
          daily_calories: dailyCalories,
          protein_pct: proteinPct,
          carbs_pct: carbsPct,
          fat_pct: fatPct,
        });

        useOnboardingStore.getState().reset();
      }

      track('onboarding_completed');
      router.replace('/(tabs)/diary');
    } catch (e) {
      Alert.alert(t('common.error'), t('errors.generic'));
      captureException(e, { feature: 'onboarding_diet' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StepIndicator totalSteps={4} currentStep={4} />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Animated.Text entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(100)} style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text, marginBottom: 24 }}>
          {t('onboarding.diet_title')}
        </Animated.Text>

        {/* Diet type */}
        <View style={{ gap: 8, marginBottom: 32 }}>
          {DIETS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDiet(d)}
              accessibilityRole="button"
              style={{
                padding: 14,
                minHeight: 44,
                borderRadius: RADIUS.md,
                backgroundColor: diet === d ? colors.primaryLight : colors.card,
                borderWidth: 2,
                borderColor: diet === d ? colors.primary : 'transparent',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontWeight: '500', color: diet === d ? colors.primary : colors.text }}>
                {t(`onboarding.diet_${d}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Allergies */}
        <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
          {t('onboarding.allergies_title')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ALLERGIES.map((a) => {
            const isSelected = allergies.includes(a);
            return (
              <Pressable
                key={a}
                onPress={() => toggleAllergy(a)}
                accessibilityRole="switch"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  minHeight: 44,
                  borderRadius: RADIUS.full,
                  backgroundColor: isSelected ? colors.dangerLight : colors.card,
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.danger : 'transparent',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontWeight: '500', color: isSelected ? colors.danger : colors.text, fontSize: FONT_SIZE.sm }}>
                  {t(`onboarding.allergy_${a}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ padding: 24, paddingBottom: 40 }}>
        <Button title={t('onboarding.done')} onPress={handleDone} loading={loading} />
        <Pressable
          onPress={() => { setDiet('balanced'); setAllergies([]); handleDone(); }}
          disabled={loading}
          style={{ alignItems: 'center', marginTop: 12, minHeight: 44, justifyContent: 'center', opacity: loading ? 0.5 : 1 }}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.skip')}
        >
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
