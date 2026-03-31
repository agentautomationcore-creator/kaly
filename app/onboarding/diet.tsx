import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { FONT_SIZE, RADIUS } from '../../src/lib/constants';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
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

  const toggleAllergy = (a: string) => {
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const handleDone = async () => {
    setLoading(true);
    try {
      // Sign in anonymously first
      await signInAnonymously();

      // Save profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // S2: Include device fingerprint to prevent abuse from anonymous accounts
        const deviceId = Device.modelId || Device.deviceName || 'unknown';
        await supabase.from('nutrition_profiles').upsert({
          id: user.id,
          diet_type: diet,
          allergies,
          onboarding_done: true,
          display_name: deviceId, // Store device fingerprint for anti-abuse tracking
        });
      }

      router.replace('/(tabs)/diary');
    } catch (e) {
      // TODO: show error
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 }}>
          {t('onboarding.diet_title')}
        </Text>

        {/* Diet type */}
        <View style={{ gap: 8, marginBottom: 32 }}>
          {DIETS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDiet(d)}
              style={{
                padding: 14,
                borderRadius: RADIUS.md,
                backgroundColor: diet === d ? colors.primaryLight : colors.card,
                borderWidth: 2,
                borderColor: diet === d ? colors.primary : 'transparent',
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
          {t('onboarding.diet_title').split('&')[1]?.trim() || 'Allergies'}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ALLERGIES.map((a) => {
            const isSelected = allergies.includes(a);
            return (
              <Pressable
                key={a}
                onPress={() => toggleAllergy(a)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: RADIUS.full,
                  backgroundColor: isSelected ? colors.dangerLight : colors.card,
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.danger : 'transparent',
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
      </View>
    </SafeAreaView>
  );
}
