import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors, lightColors, darkColors } from '../src/lib/theme';
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/lib/supabase';
import { RADIUS, SPACING, MIN_TOUCH } from '../src/lib/constants';
import { typography } from '../src/lib/typography';

// ── WCAG contrast ratio calculation ──
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 0;
  const l1 = luminance(...rgb1);
  const l2 = luminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Test definitions ──
interface TestResult {
  name: string;
  pass: boolean;
  detail: string;
}

function runContrastTests(): TestResult[] {
  const results: TestResult[] = [];
  const themes = [
    { name: 'Light', c: lightColors },
    { name: 'Dark', c: darkColors },
  ];

  for (const { name, c } of themes) {
    // Primary button: textInverse on primary
    const btnContrast = contrastRatio(c.textInverse, c.primary);
    results.push({
      name: `${name}: Primary button text`,
      pass: btnContrast >= 3,
      detail: `${c.textInverse} on ${c.primary} = ${btnContrast.toFixed(1)}:1 (min 3:1 for large text)`,
    });

    // Disabled button: textSecondary on surfaceElevated
    const disContrast = contrastRatio(c.textSecondary, c.surfaceElevated);
    results.push({
      name: `${name}: Disabled button text`,
      pass: disContrast >= 3,
      detail: `${c.textSecondary} on ${c.surfaceElevated} = ${disContrast.toFixed(1)}:1`,
    });

    // Body text on bg
    const bodyContrast = contrastRatio(c.textPrimary, c.bg);
    results.push({
      name: `${name}: Body text on bg`,
      pass: bodyContrast >= 4.5,
      detail: `${c.textPrimary} on ${c.bg} = ${bodyContrast.toFixed(1)}:1 (min 4.5:1)`,
    });

    // Secondary text on bg
    const secContrast = contrastRatio(c.textSecondary, c.bg);
    results.push({
      name: `${name}: Secondary text on bg`,
      pass: secContrast >= 3,
      detail: `${c.textSecondary} on ${c.bg} = ${secContrast.toFixed(1)}:1`,
    });

    // Tertiary text on bg
    const terContrast = contrastRatio(c.textTertiary, c.bg);
    results.push({
      name: `${name}: Tertiary text on bg`,
      pass: terContrast >= 2,
      detail: `${c.textTertiary} on ${c.bg} = ${terContrast.toFixed(1)}:1 (min 2:1 for decorative)`,
    });

    // Card text on card bg
    const cardContrast = contrastRatio(c.textPrimary, c.card);
    results.push({
      name: `${name}: Text on card`,
      pass: cardContrast >= 4.5,
      detail: `${c.textPrimary} on ${c.card} = ${cardContrast.toFixed(1)}:1`,
    });

    // Primary text on primarySubtle (chips, badges)
    const chipContrast = contrastRatio(c.primary, c.primarySubtle);
    results.push({
      name: `${name}: Primary on primarySubtle`,
      pass: chipContrast >= 3,
      detail: `${c.primary} on ${c.primarySubtle} = ${chipContrast.toFixed(1)}:1`,
    });

    // Border visible on bg
    const borderContrast = contrastRatio(c.border, c.bg);
    results.push({
      name: `${name}: Border visible on bg`,
      pass: borderContrast >= 1.3,
      detail: `${c.border} on ${c.bg} = ${borderContrast.toFixed(1)}:1 (min 1.3:1)`,
    });
  }

  return results;
}

async function runWaterTest(userId: string, date: string): Promise<TestResult> {
  try {
    // Read current count
    const { data: before } = await supabase
      .from('water_log')
      .select('id')
      .eq('user_id', userId)
      .eq('logged_at', date);
    const countBefore = (before || []).length;

    // Insert
    const { error: insertErr } = await supabase.from('water_log').insert({
      user_id: userId,
      logged_at: date,
      ml: 250,
    });
    if (insertErr) return { name: 'Water: add glass', pass: false, detail: `Insert failed: ${insertErr.message}` };

    // Read after
    const { data: after } = await supabase
      .from('water_log')
      .select('id')
      .eq('user_id', userId)
      .eq('logged_at', date);
    const countAfter = (after || []).length;

    if (countAfter !== countBefore + 1) {
      return { name: 'Water: add glass', pass: false, detail: `Expected ${countBefore + 1}, got ${countAfter}` };
    }

    // Delete the test entry
    const lastId = after![after!.length - 1].id;
    const { error: delErr } = await supabase.from('water_log').delete().eq('id', lastId).eq('user_id', userId);
    if (delErr) return { name: 'Water: remove glass', pass: false, detail: `Delete failed: ${delErr.message}` };

    // Verify count back
    const { data: final } = await supabase
      .from('water_log')
      .select('id')
      .eq('user_id', userId)
      .eq('logged_at', date);
    const countFinal = (final || []).length;

    if (countFinal !== countBefore) {
      return { name: 'Water: remove glass', pass: false, detail: `Expected ${countBefore}, got ${countFinal}` };
    }

    return { name: 'Water: add + remove', pass: true, detail: `${countBefore} → ${countAfter} → ${countFinal}` };
  } catch (e) {
    return { name: 'Water: add + remove', pass: false, detail: `Error: ${(e as Error).message}` };
  }
}

async function runProfileTest(userId: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    // Read current profile
    const { data: profile, error: readErr } = await supabase
      .from('nutrition_profiles')
      .select('diet_type, weight_kg, daily_calories')
      .eq('id', userId)
      .single();

    if (readErr || !profile) {
      results.push({ name: 'Profile: read', pass: false, detail: readErr?.message || 'No profile found' });
      return results;
    }

    results.push({ name: 'Profile: read', pass: true, detail: `diet=${profile.diet_type}, cal=${profile.daily_calories}` });

    // Write test weight
    const testWeight = 77.7;
    const { error: weightErr } = await supabase
      .from('weight_log')
      .upsert({ user_id: userId, logged_at: '2099-01-01', weight_kg: testWeight }, { onConflict: 'user_id,logged_at' });

    if (weightErr) {
      results.push({ name: 'Weight: write', pass: false, detail: weightErr.message });
    } else {
      // Read back
      const { data: w } = await supabase
        .from('weight_log')
        .select('weight_kg')
        .eq('user_id', userId)
        .eq('logged_at', '2099-01-01')
        .single();

      const match = w?.weight_kg === testWeight;
      results.push({ name: 'Weight: write + read', pass: match, detail: `Wrote ${testWeight}, read ${w?.weight_kg}` });

      // Cleanup
      await supabase.from('weight_log').delete().eq('user_id', userId).eq('logged_at', '2099-01-01');
    }

    // Diet write test
    const origDiet = profile.diet_type;
    const testDiet = origDiet === 'balanced' ? 'keto' : 'balanced';
    const { error: dietErr } = await supabase
      .from('nutrition_profiles')
      .update({ diet_type: testDiet })
      .eq('id', userId);

    if (dietErr) {
      results.push({ name: 'Diet: write', pass: false, detail: dietErr.message });
    } else {
      const { data: d } = await supabase
        .from('nutrition_profiles')
        .select('diet_type')
        .eq('id', userId)
        .single();

      const match = d?.diet_type === testDiet;
      results.push({ name: 'Diet: write + read', pass: match, detail: `Wrote ${testDiet}, read ${d?.diet_type}` });

      // Restore
      await supabase.from('nutrition_profiles').update({ diet_type: origDiet }).eq('id', userId);
    }
  } catch (e) {
    results.push({ name: 'Profile tests', pass: false, detail: (e as Error).message });
  }

  return results;
}

function runI18nTests(t: (key: string) => string): TestResult[] {
  const keysToCheck = [
    'common.back', 'common.calories', 'common.kcal', 'common.save',
    'scan.save_to_diary', 'scan.confidence',
    'diary.tap_to_add', 'diary.remove_water', 'diary.favorite', 'diary.favorites_and_recent',
    'stats.week', 'stats.month', 'stats.remaining_label', 'stats.over', 'stats.longest_streak',
    'fasting.elapsed', 'fasting.goal', 'fasting.fed_state', 'fasting.autophagy',
    'food_search.add_manually', 'food_search.per_100g',
    'manual_entry.optional',
    'text_entry.title', 'text_entry.analyze',
    'voice.listening',
    'meal_memory.your_usual',
    'confidence.high', 'confidence.low',
    'onboarding.diet_pescatarian', 'onboarding.diet_halal', 'onboarding.diet_kosher',
    'profile.adaptive_recalc',
  ];

  const results: TestResult[] = [];
  const missing: string[] = [];

  for (const key of keysToCheck) {
    const val = t(key);
    // i18next returns the key itself if not found
    if (val === key) {
      missing.push(key);
    }
  }

  results.push({
    name: `i18n: ${keysToCheck.length} keys checked`,
    pass: missing.length === 0,
    detail: missing.length === 0 ? 'All keys present' : `Missing: ${missing.join(', ')}`,
  });

  return results;
}

// ── Screen ──
export default function DebugScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const runAll = async () => {
    setRunning(true);
    setResults([]);
    const all: TestResult[] = [];

    // 1. Contrast tests
    all.push(...runContrastTests());

    // 2. i18n tests
    all.push(...runI18nTests(t));

    // 3. Water test
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const waterResult = await runWaterTest(user.id, today);
      all.push(waterResult);
    } else {
      all.push({ name: 'Water test', pass: false, detail: 'No authenticated user' });
    }

    // 4. Profile tests
    if (user) {
      const profileResults = await runProfileTest(user.id);
      all.push(...profileResults);
    } else {
      all.push({ name: 'Profile tests', pass: false, detail: 'No authenticated user' });
    }

    setResults(all);
    setRunning(false);
  };

  useEffect(() => { runAll(); }, []);

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const total = results.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING[4], paddingVertical: SPACING[2] }}>
        <Pressable onPress={() => router.back()} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="button">
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ ...typography.h3, color: colors.textPrimary }}>Debug Tests</Text>
        <Pressable onPress={runAll} disabled={running} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }} accessibilityRole="button">
          <Ionicons name="refresh" size={24} color={running ? colors.textTertiary : colors.primary} />
        </Pressable>
      </View>

      {/* Summary */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: SPACING[4], paddingVertical: SPACING[3], backgroundColor: colors.surface }}>
        <Text style={{ ...typography.h2, color: colors.success }}>{passed} {'\u2705'}</Text>
        <Text style={{ ...typography.h2, color: failed > 0 ? colors.error : colors.textTertiary }}>{failed} {'\u274C'}</Text>
        <Text style={{ ...typography.body, color: colors.textSecondary }}>/ {total}</Text>
      </View>

      {/* Results */}
      <ScrollView contentContainerStyle={{ padding: SPACING[4], gap: SPACING[2] }}>
        {running && (
          <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: SPACING[6] }}>
            Running tests...
          </Text>
        )}
        {results.map((r, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: SPACING[2],
              padding: SPACING[3],
              backgroundColor: r.pass ? colors.surface : colors.errorSubtle,
              borderRadius: RADIUS.md,
              borderWidth: r.pass ? 0 : 1,
              borderColor: r.pass ? 'transparent' : colors.error,
            }}
          >
            <Text style={{ fontSize: 18 }}>{r.pass ? '\u2705' : '\u274C'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.smallMedium, color: colors.textPrimary }}>{r.name}</Text>
              <Text style={{ ...typography.caption, color: r.pass ? colors.textTertiary : colors.error }}>{r.detail}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
