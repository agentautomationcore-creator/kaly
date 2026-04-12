import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import type { MealType } from '../../../lib/types';

export interface MealPattern {
  id: string;
  user_id: string;
  food_name: string;
  food_name_en: string;
  meal_type: MealType;
  frequency: number;
  last_logged_at: string;
  food_data: {
    food_items: unknown[];
    quantity_g: number | null;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    total_fiber: number;
    entry_method: string;
    confidence: number | null;
  };
}

/**
 * Get top meal patterns for a specific meal type.
 * Returns meals the user eats most frequently at this time of day.
 * Only returns patterns with frequency >= 2 (eaten at least twice).
 */
export function useMealSuggestions(mealType: MealType) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['meal-patterns', mealType],
    queryFn: async (): Promise<MealPattern[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('meal_patterns')
        .select('*')
        .eq('user_id', user.id)
        .eq('meal_type', mealType)
        .gte('frequency', 2)
        .order('frequency', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });
}
