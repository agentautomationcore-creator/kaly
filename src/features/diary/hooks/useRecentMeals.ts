import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { DiaryEntry } from '../types';

export function useRecentMeals() {
  return useQuery({
    queryKey: ['recent-meals'],
    queryFn: async (): Promise<DiaryEntry[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Deduplicate by food_name_en
      const seen = new Set<string>();
      return (data || []).filter((e) => {
        const key = e.food_name_en || e.food_name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    staleTime: 1000 * 60 * 10,
  });
}
