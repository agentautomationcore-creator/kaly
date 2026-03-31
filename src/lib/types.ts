import type { MealType } from './constants';
import type { Gender, ActivityLevel, Goal, DietType } from './nutrition';

// Re-export for convenience
export type { MealType, Gender, ActivityLevel, Goal, DietType };

// ============ Nutrition ============

export interface NutritionTotal {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
}

export interface FoodItem {
  name: string;
  name_en: string;
  g: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  confidence: number;
  hidden: boolean; // oil, butter, sauces
}

export interface ScanResult {
  dish_name: string;
  dish_name_en: string;
  total_portion_g: number;
  confidence: number;
  total: NutritionTotal;
  items: FoodItem[];
  preparation?: string;
  cuisine?: string;
  warnings: string[];
  notes?: string;
  cached: boolean;
}

// ============ Diary ============

export interface DiaryEntry {
  id: string;
  user_id: string;
  logged_at: string; // date ISO
  meal_type: MealType;
  food_name: string;
  food_name_en?: string;
  food_items: FoodItem[];
  quantity_g?: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  photo_url?: string;
  confidence?: number;
  entry_method: 'photo' | 'barcode' | 'search' | 'manual';
  edited: boolean;
  source_entry_id?: string;
  created_at: string;
}

// ============ Profile ============

export interface NutritionProfile {
  id: string;
  display_name?: string;
  diet_type: DietType;
  daily_calories: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
  allergies: string[];
  custom_exclusions: string[];
  goal: Goal;
  height_cm?: number;
  weight_kg?: number;
  target_weight_kg?: number;
  age?: number;
  gender?: Gender;
  activity_level: ActivityLevel;
  units: 'metric' | 'imperial';
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  water_goal_ml: number;
  onboarding_done: boolean;
  trial_start_date: string;
  plan: 'free' | 'pro';
  created_at: string;
  updated_at: string;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  logged_at: string;
  weight_kg: number;
  created_at: string;
}

export interface WaterEntry {
  id: string;
  user_id: string;
  logged_at: string;
  ml: number;
  created_at: string;
}
