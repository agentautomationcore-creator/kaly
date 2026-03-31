import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import type { WeightLogEntry } from '../types';

export function useWeightLog() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['weight-log'],
    queryFn: async (): Promise<WeightLogEntry[]> => {
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
    enabled: !!user,
  });
}

export function useLogWeight() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (weightKg: number) => {
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
