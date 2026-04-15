import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { track } from '../../../lib/analytics';
import type { WaterEntry } from '../types';

const GLASS_ML = 250;
const DAILY_MAX_ML = 10000;

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
      const currentTotal = (query.data || []).reduce((sum, e) => sum + e.ml, 0);
      if (currentTotal + GLASS_ML > DAILY_MAX_ML) {
        throw new Error('DAILY_MAX');
      }

      const { error } = await supabase.from('water_log').insert({
        user_id: user.id,
        logged_at: date,
        ml: GLASS_ML,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      track('water_logged');
      qc.invalidateQueries({ queryKey: ['water', date] });
    },
  });

  const removeGlass = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const entries = query.data || [];
      const last = entries[entries.length - 1];
      if (!last) throw new Error('NO_ENTRIES');

      const { error } = await supabase.from('water_log').delete().eq('id', last.id).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water', date] });
    },
  });

  const totalMl = (query.data || []).reduce((sum, e) => sum + e.ml, 0);
  const glasses = Math.floor(totalMl / GLASS_ML);

  return { ...query, totalMl, glasses, addGlass, removeGlass };
}
