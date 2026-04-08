import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, withTimeout } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import type { DiaryEntry } from '../types';

export function useDiary(date: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['diary', date],
    queryFn: async (): Promise<DiaryEntry[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_at', date)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useAddEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<DiaryEntry, 'id' | 'created_at'>) => {
      const { error } = await withTimeout(supabase.from('diary_entries').insert(entry).then(r => r), 15000, 'diary-insert');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diary'] });
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await withTimeout(supabase.from('diary_entries').delete().eq('id', entryId).then(r => r), 15000, 'diary-delete');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diary'] });
    },
  });
}
