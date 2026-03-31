import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { WeightLogEntry } from '../types';

export function useWeightLog() {
  return useQuery({
    queryKey: ['weight-log'],
    queryFn: async (): Promise<WeightLogEntry[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('weight_log')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(90);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useLogWeight() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (weightKg: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('weight_log')
        .upsert(
          { user_id: user.id, logged_at: today, weight_kg: weightKg },
          { onConflict: 'user_id,logged_at' }
        );

      if (error) throw error;

      // Also update profile
      await supabase
        .from('nutrition_profiles')
        .update({ weight_kg: weightKg })
        .eq('id', user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weight-log'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
