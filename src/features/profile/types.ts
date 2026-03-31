export interface NutritionProfile {
  id: string;
  display_name: string | null;
  diet_type: string;
  daily_calories: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
  allergies: string[];
  custom_exclusions: string[];
  goal: string;
  height_cm: number | null;
  weight_kg: number | null;
  target_weight_kg: number | null;
  age: number | null;
  gender: string | null;
  activity_level: string;
  units: string;
  language: string;
  theme: string;
  notifications: boolean;
  water_goal_ml: number;
  onboarding_done: boolean;
  trial_start_date: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface WeightLogEntry {
  id: string;
  user_id: string;
  logged_at: string;
  weight_kg: number;
  created_at: string;
}
