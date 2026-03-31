import type { MealType } from '../../lib/types';

export interface DiaryEntry {
  id: string;
  user_id: string;
  logged_at: string;
  meal_type: MealType;
  food_name: string;
  food_name_en: string | null;
  food_items: any[];
  quantity_g: number | null;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  photo_url: string | null;
  confidence: number | null;
  entry_method: 'photo' | 'barcode' | 'search' | 'manual';
  edited: boolean;
  source_entry_id: string | null;
  created_at: string;
}

export interface WaterEntry {
  id: string;
  user_id: string;
  logged_at: string;
  ml: number;
  created_at: string;
}

export interface DayData {
  entries: DiaryEntry[];
  waterMl: number;
  waterEntries: WaterEntry[];
}
