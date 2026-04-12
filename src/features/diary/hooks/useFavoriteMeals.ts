import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import type { DiaryEntry } from '../types';

export interface FavoriteMeal {
  id: string;
  user_id: string;
  food_name: string;
  food_name_en: string;
  food_data: {
    food_items: DiaryEntry['food_items'];
    quantity_g: number | null;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    total_fiber: number;
    entry_method: DiaryEntry['entry_method'];
    confidence: number | null;
  };
  created_at: string;
}

export function useFavoriteMeals() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['favorite-meals'],
    queryFn: async (): Promise<FavoriteMeal[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('favorite_meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

export function useIsFavorite(foodNameEn: string) {
  const { data: favorites } = useFavoriteMeals();
  return (favorites || []).some((f) => f.food_name_en === foodNameEn);
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (entry: DiaryEntry) => {
      if (!user) throw new Error('Not authenticated');

      // Check if already favorited
      const { data: existing } = await supabase
        .from('favorite_meals')
        .select('id')
        .eq('user_id', user.id)
        .eq('food_name_en', entry.food_name_en || entry.food_name)
        .single();

      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from('favorite_meals')
          .delete()
          .eq('id', existing.id)
          .eq('user_id', user.id);
        if (error) throw error;
        return { action: 'removed' as const };
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorite_meals')
          .insert({
            user_id: user.id,
            food_name: entry.food_name,
            food_name_en: entry.food_name_en || entry.food_name,
            food_data: {
              food_items: entry.food_items,
              quantity_g: entry.quantity_g || null,
              total_calories: entry.total_calories,
              total_protein: entry.total_protein,
              total_carbs: entry.total_carbs,
              total_fat: entry.total_fat,
              total_fiber: entry.total_fiber,
              entry_method: entry.entry_method,
              confidence: entry.confidence || null,
            },
          });
        if (error) throw error;
        return { action: 'added' as const };
      }
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['favorite-meals'] });
      track(result.action === 'added' ? 'meal_favorited' : 'meal_unfavorited');
    },
    onError: (error) => {
      captureException(error, { feature: 'toggle_favorite' });
    },
  });
}
