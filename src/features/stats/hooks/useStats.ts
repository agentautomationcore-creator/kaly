import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { DayStats, WeekStats } from '../types';

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function useWeekStats() {
  return useQuery({
    queryKey: ['stats', 'week'],
    queryFn: async (): Promise<WeekStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { days: [], avgCalories: 0, streak: 0 };

      const days = getLast7Days();
      const startDate = days[0];
      const endDate = days[days.length - 1];

      const { data: entries } = await supabase
        .from('diary_entries')
        .select('logged_at, total_calories, total_protein, total_carbs, total_fat, total_fiber')
        .eq('user_id', user.id)
        .gte('logged_at', startDate)
        .lte('logged_at', endDate);

      const dayMap: Record<string, DayStats> = {};
      for (const d of days) {
        dayMap[d] = { date: d, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, entryCount: 0 };
      }

      for (const e of entries || []) {
        const d = dayMap[e.logged_at];
        if (d) {
          d.calories += e.total_calories;
          d.protein += e.total_protein;
          d.carbs += e.total_carbs;
          d.fat += e.total_fat;
          d.fiber += e.total_fiber;
          d.entryCount++;
        }
      }

      const dayStats = days.map((d) => dayMap[d]);
      const daysWithEntries = dayStats.filter((d) => d.entryCount > 0);
      const avgCalories = daysWithEntries.length > 0
        ? daysWithEntries.reduce((s, d) => s + d.calories, 0) / daysWithEntries.length
        : 0;

      // Calculate streak
      let streak = 0;
      for (let i = dayStats.length - 1; i >= 0; i--) {
        if (dayStats[i].entryCount > 0) streak++;
        else break;
      }

      return { days: dayStats, avgCalories, streak };
    },
    staleTime: 1000 * 60 * 5,
  });
}
