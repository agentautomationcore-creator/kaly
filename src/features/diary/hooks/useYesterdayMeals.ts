import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import type { DiaryEntry } from '../types';
import type { MealType } from '../../../lib/types';

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function useYesterdayMeals() {
  const user = useAuthStore((s) => s.user);
  const yesterday = getYesterday();

  return useQuery({
    queryKey: ['diary', yesterday, 'yesterday-suggest'],
    queryFn: async (): Promise<Record<MealType, DiaryEntry[]>> => {
      if (!user) return { breakfast: [], lunch: [], dinner: [], snack: [] };

      const { data } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_at', yesterday)
        .order('created_at', { ascending: true });

      const result: Record<MealType, DiaryEntry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
      for (const entry of data || []) {
        if (result[entry.meal_type as MealType]) {
          result[entry.meal_type as MealType].push(entry);
        }
      }
      return result;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });
}
