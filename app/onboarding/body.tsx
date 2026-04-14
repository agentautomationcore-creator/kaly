import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, AccessibilityInfo } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { IconButton } from '../../src/components/IconButton';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { RADIUS, MIN_TOUCH, SPACING } from '../../src/lib/constants';
import { typography } from '../../src/lib/typography';
import type { Gender, ActivityLevel } from '../../src/lib/nutrition';

const GENDERS = ['male', 'female'] as const;

export default function BodyScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [genderIdx, setGenderIdx] = useState(-1);
  const gender = genderIdx >= 0 ? GENDERS[genderIdx] : null;
  const canContinue = !!(height && weight && age && gender);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); }, []);

  const inputStyle = {
    minHeight: 52,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING[4],
    borderWidth: 1,
    borderColor: colors.border,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING[6], marginBottom: SPACING[2] }}>
        <IconButton icon="chevron-back" onPress={() => router.back()} accessibilityLabel={t('common.back')} />
      </View>

      {/* Progress */}
      <View style={{ flexDirection: 'row', gap: 4, marginHorizontal: SPACING[6], marginBottom: SPACING[6] }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < 2 ? colors.primary : colors.border }} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: SPACING[6], paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          <Animated.Text accessibilityRole="header" entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(100)} style={{ ...typography.title, color: colors.textPrimary, marginBottom: SPACING[6] }}>
            {t('onboarding.body_title')}
          </Animated.Text>

          {/* Gender */}
          <Text style={{ ...typography.smallMedium, color: colors.textSecondary, marginBottom: SPACING[2] }}>
            {t('onboarding.gender')}
          </Text>
          <SegmentedControl
            items={GENDERS.map((g) => t(`onboarding.${g}`))}
            activeIndex={genderIdx >= 0 ? genderIdx : -1}
            onChange={setGenderIdx}
          />

          <View style={{ marginTop: SPACING[6] }} />

          {/* Height, Weight, Age */}
          {[
            { label: t('onboarding.height'), value: height, set: setHeight, suffix: t('units.cm'), placeholder: '170' },
            { label: t('onboarding.weight'), value: weight, set: setWeight, suffix: t('units.kg'), placeholder: '70' },
            { label: t('onboarding.age'), value: age, set: setAge, suffix: '', placeholder: '25' },
          ].map((field) => (
            <View key={field.label} style={{ marginBottom: SPACING[4] }}>
              <Text style={{ ...typography.smallMedium, color: colors.textSecondary, marginBottom: SPACING[1] }}>
                {field.label} {field.suffix ? `(${field.suffix})` : ''}
              </Text>
              <TextInput
                value={field.value}
                onChangeText={field.set}
                keyboardType="numeric"
                accessibilityLabel={field.label}
                style={inputStyle}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ padding: SPACING[6], paddingBottom: 40, gap: SPACING[3] }}>
        <Button title={`${t('onboarding.next')} \u2192`} onPress={() => {
          const w = parseFloat(weight);
          const h = parseFloat(height);
          const a = parseInt(age, 10);
          if (w <= 0 || w > 300) { Alert.alert(t('common.error'), t('onboarding.invalid_weight')); return; }
          if (h <= 0 || h > 300) { Alert.alert(t('common.error'), t('onboarding.invalid_height')); return; }
          if (a < 12 || a > 120) { Alert.alert(t('common.error'), t('onboarding.invalid_age')); return; }
          useOnboardingStore.getState().setBody({
            gender: gender as Gender,
            heightCm: h,
            weightKg: w,
            age: a,
            activityLevel: 'moderate' as ActivityLevel,
          });
          router.push('/onboarding/diet');
        }} disabled={!canContinue} />
        <Button title={t('onboarding.skip')} variant="ghost" onPress={() => router.push('/onboarding/diet')} />
      </View>

    </SafeAreaView>
  );
}
