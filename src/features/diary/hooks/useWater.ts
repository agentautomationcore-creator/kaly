import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import type { WaterEntry } from '../types';

const GLASS_ML = 250;

export function useWater(date: string) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ['water', date],
    queryFn: async (): Promise<WaterEntry[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('water_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_at', date)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const addGlass = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('water_log').insert({
        user_id: user.id,
        logged_at: date,
        ml: GLASS_ML,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water', date] });
    },
  });

  const totalMl = (query.data || []).reduce((sum, e) => sum + e.ml, 0);
  const glasses = Math.floor(totalMl / GLASS_ML);

  return { ...query, totalMl, glasses, addGlass };
}
