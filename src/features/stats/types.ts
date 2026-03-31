export interface DayStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  entryCount: number;
}

export interface WeekStats {
  days: DayStats[];
  avgCalories: number;
  streak: number;
}
