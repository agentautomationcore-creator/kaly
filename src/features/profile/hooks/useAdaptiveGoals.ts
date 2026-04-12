import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useWeightLog } from './useWeightLog';
import { supabase } from '../../../lib/supabase';
import { queryClient } from '../../../lib/queryClient';
import { calculateTDEE, calculateDailyTarget } from '../../../lib/nutrition';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'kaly-settings' });
import type { NutritionProfile } from '../../../lib/types';

const RECALC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const STORAGE_KEY = 'lastGoalRecalcAt';

/**
 * Adaptive calorie goals: recalculates daily_calories weekly
 * based on latest weight from weight_log using Mifflin-St Jeor.
 *
 * Runs once on mount, then only if:
 * - User has height, age, gender, activity_level set
 * - There's a weight entry in weight_log
 * - At least 7 days since last recalculation
 * - Weight has changed by at least 0.5 kg
 */
export function useAdaptiveGoals(): {
  lastRecalcDate: string | null;
  recalcNow: () => Promise<number | null>;
} {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const { data: weightLog } = useWeightLog();
  const hasChecked = useRef(false);

  const recalcNow = async (): Promise<number | null> => {
    if (!profile) return null;

    const { height_cm, age, gender, activity_level, goal } = profile;
    if (!height_cm || !age || !gender || !activity_level) return null;

    // Get latest weight from weight_log
    const latestWeight = weightLog?.[0]?.weight_kg;
    if (!latestWeight) return null;

    const tdee = calculateTDEE(latestWeight, height_cm, age, gender, activity_level);
    const newCalories = calculateDailyTarget(tdee, goal);

    // Update profile in DB
    try {
      const { error } = await supabase
        .from('nutrition_profiles')
        .update({
          daily_calories: newCalories,
          weight_kg: latestWeight,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Update local state
      const updatedProfile: NutritionProfile = {
        ...profile,
        daily_calories: newCalories,
        weight_kg: latestWeight,
      };
      setProfile(updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      // Save recalc timestamp
      storage.set(STORAGE_KEY, Date.now().toString());

      track('goals_recalculated', {
        old_calories: profile.daily_calories,
        new_calories: newCalories,
        weight_change: latestWeight - (profile.weight_kg || latestWeight),
      });

      return newCalories;
    } catch (e) {
      captureException(e, { feature: 'adaptive_goals' });
      return null;
    }
  };

  // Auto-check on mount
  useEffect(() => {
    if (hasChecked.current || !profile || !weightLog) return;
    hasChecked.current = true;

    const { height_cm, age, gender, activity_level, weight_kg } = profile;
    if (!height_cm || !age || !gender || !activity_level) return;

    const latestWeight = weightLog[0]?.weight_kg;
    if (!latestWeight) return;

    // Check if enough time has passed
    const lastRecalc = storage.getString(STORAGE_KEY);
    if (lastRecalc) {
      const elapsed = Date.now() - parseInt(lastRecalc, 10);
      if (elapsed < RECALC_INTERVAL_MS) return;
    }

    // Check if weight changed significantly (>= 0.5 kg)
    const currentWeight = weight_kg || 0;
    if (Math.abs(latestWeight - currentWeight) < 0.5) return;

    // Recalculate
    recalcNow();
  }, [profile, weightLog]);

  const lastRecalcDate = storage.getString(STORAGE_KEY)
    ? new Date(parseInt(storage.getString(STORAGE_KEY)!, 10)).toISOString().split('T')[0]
    : null;

  return { lastRecalcDate, recalcNow };
}
