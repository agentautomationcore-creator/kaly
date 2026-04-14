import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, AccessibilityInfo } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { IconButton } from '../../src/components/IconButton';
import { Chip } from '../../src/components/Chip';
import { SPACING } from '../../src/lib/constants';
import { typography } from '../../src/lib/typography';
import { useAuthStore } from '../../src/stores/authStore';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { supabase } from '../../src/lib/supabase';
import { captureException } from '../../src/lib/sentry';
import { track } from '../../src/lib/analytics';
import { calculateTDEE, calculateDailyTarget, calculateMacroSplit } from '../../src/lib/nutrition';
import type { Gender, DietType } from '../../src/lib/nutrition';
import * as Device from 'expo-device';

const DIETS = ['balanced', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'halal', 'kosher'] as const;
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
      // Only sign in if not already authenticated
      const { data: { user: existingUser } } = await supabase.auth.getUser();
      if (!existingUser) {
        await signInAnonymously();
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const ob = useOnboardingStore.getState();
        const deviceId = Device.modelId || Device.deviceName || 'unknown';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING[6], marginBottom: SPACING[2] }}>
        <IconButton icon="chevron-back" onPress={() => router.back()} accessibilityLabel={t('common.back')} />
      </View>

      {/* Progress */}
      <View style={{ flexDirection: 'row', gap: 4, marginHorizontal: SPACING[6], marginBottom: SPACING[6] }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < 3 ? colors.primary : colors.border }} />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING[6], paddingBottom: 100 }}>
        <Animated.Text accessibilityRole="header" entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(100)} style={{ ...typography.title, color: colors.textPrimary, marginBottom: SPACING[6] }}>
          {t('onboarding.diet_title')}
        </Animated.Text>

        {/* Diet chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2] }}>
          {DIETS.map((d) => (
            <Chip key={d} label={t(`onboarding.diet_${d}`)} selected={diet === d} onToggle={() => setDiet(d)} />
          ))}
        </View>

        <View style={{ marginTop: SPACING[8] }} />

        {/* Allergies */}
        <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: SPACING[3] }}>
          {t('onboarding.allergies_title')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2] }}>
          {ALLERGIES.map((a) => (
            <Chip key={a} label={t(`onboarding.allergy_${a}`)} selected={allergies.includes(a)} onToggle={() => toggleAllergy(a)} variant="allergen" />
          ))}
        </View>
      </ScrollView>

      <View style={{ padding: SPACING[6], paddingBottom: 40, gap: SPACING[3] }}>
        <Button title={`${t('onboarding.done')} \u2192`} onPress={handleDone} loading={loading} />
        <Button
          title={t('onboarding.skip')}
          variant="ghost"
          onPress={() => { setDiet('balanced'); setAllergies([]); handleDone(); }}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}
