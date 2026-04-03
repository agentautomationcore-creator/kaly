import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { ConsentModal } from '../../src/components/ConsentModal';
import { StepIndicator } from '../../src/components/StepIndicator';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { FONT_SIZE, RADIUS } from '../../src/lib/constants';
import type { Gender, ActivityLevel } from '../../src/lib/nutrition';

const GENDERS = ['male', 'female'] as const;
const ACTIVITIES = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;

export default function BodyScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [activity, setActivity] = useState<string>('moderate');
  const healthConsentGiven = useSettingsStore((s) => s.healthConsentGiven);
  const setHealthConsent = useSettingsStore((s) => s.setHealthConsent);
  const [showHealthConsent, setShowHealthConsent] = useState(!healthConsentGiven);

  const canContinue = height && weight && age && gender && healthConsentGiven;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StepIndicator totalSteps={4} currentStep={3} />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 }}>
          {t('onboarding.body_title')}
        </Text>

        {/* Gender */}
        <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginBottom: 8, fontWeight: '500' }}>
          {t('onboarding.gender')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {GENDERS.map((g) => (
            <Pressable
              key={g}
              onPress={() => setGender(g)}
              style={{
                flex: 1,
                padding: 14,
                minHeight: 44,
                borderRadius: RADIUS.md,
                backgroundColor: gender === g ? colors.primaryLight : colors.card,
                borderWidth: 2,
                borderColor: gender === g ? colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontWeight: '600', color: gender === g ? colors.primary : colors.text }}>
                {t(`onboarding.${g}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Height, Weight, Age */}
        {[
          { label: t('onboarding.height'), value: height, set: setHeight, suffix: 'cm', key: 'height' },
          { label: t('onboarding.weight'), value: weight, set: setWeight, suffix: 'kg', key: 'weight' },
          { label: t('onboarding.age'), value: age, set: setAge, suffix: '', key: 'age' },
        ].map((field) => (
          <View key={field.key} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginBottom: 8, fontWeight: '500' }}>
              {field.label} {field.suffix ? `(${field.suffix})` : ''}
            </Text>
            <TextInput
              value={field.value}
              onChangeText={field.set}
              keyboardType="numeric"
              style={{
                backgroundColor: colors.card,
                borderRadius: RADIUS.md,
                padding: 14,
                fontSize: FONT_SIZE.md,
                color: colors.text,
              }}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        ))}

        {/* Activity level */}
        <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginBottom: 8, fontWeight: '500' }}>
          {t('onboarding.activity')}
        </Text>
        <View style={{ gap: 8 }}>
          {ACTIVITIES.map((a) => (
            <Pressable
              key={a}
              onPress={() => setActivity(a)}
              style={{
                padding: 14,
                borderRadius: RADIUS.md,
                backgroundColor: activity === a ? colors.primaryLight : colors.card,
                borderWidth: 2,
                borderColor: activity === a ? colors.primary : 'transparent',
              }}
            >
              <Text style={{ fontWeight: '500', color: activity === a ? colors.primary : colors.text }}>
                {t(`onboarding.activity_${a}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={{ padding: 24, paddingBottom: 40 }}>
        <Button title={t('onboarding.next')} onPress={() => {
          const w = parseFloat(weight);
          const h = parseFloat(height);
          const a = parseInt(age, 10);
          if (w <= 0 || w > 300) {
            Alert.alert(t('common.error'), t('onboarding.invalid_weight'));
            return;
          }
          if (h <= 0 || h > 300) {
            Alert.alert(t('common.error'), t('onboarding.invalid_height'));
            return;
          }
          if (a < 12 || a > 120) {
            Alert.alert(t('common.error'), t('onboarding.invalid_age'));
            return;
          }
          useOnboardingStore.getState().setBody({
            gender: gender as Gender,
            heightCm: h,
            weightKg: w,
            age: a,
            activityLevel: activity as ActivityLevel,
          });
          router.push('/onboarding/diet');
        }} disabled={!canContinue} />
      </View>

      {/* GDPR-2: Health data consent */}
      <ConsentModal
        visible={showHealthConsent}
        type="health"
        onAccept={async () => {
          setHealthConsent(true);
          setShowHealthConsent(false);
          const user = useAuthStore.getState().user;
          if (user) {
            await supabase.from('nutrition_profiles').update({
              health_consent_given: true,
              health_consent_at: new Date().toISOString(),
            }).eq('id', user.id);
          }
        }}
        onDecline={() => {
          setShowHealthConsent(false);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
