import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, withTimeout } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import type { NutritionProfile } from '../types';

export function useProfile() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<NutritionProfile | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('nutrition_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (updates: Partial<NutritionProfile>) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await withTimeout(
        supabase.from('nutrition_profiles').upsert({ id: user.id, ...updates }).then(r => r),
        15000,
        'profile-upsert',
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
