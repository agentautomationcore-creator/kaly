import { Platform } from 'react-native';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Limits
export const FREE_SCANS_PER_DAY = 3;
export const FREE_TRIAL_DAYS = 7;
export const MAX_IMAGE_SIZE_KB = 512;
export const MAX_IMAGE_DIMENSION = 1024;

// UI
export const MIN_TOUCH = 44;
export const RADIUS = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 9999 };
export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const FONT_SIZE = {
  xxs: 10,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 20,
  xxl: 24,
  heading: 28,
  hero: 36,
  display: 48,
};

// Meal types
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

// Water
export const WATER_GLASS_ML = 250;
export const DEFAULT_WATER_GOAL_ML = 2000;

// Platform
export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';
export const IS_WEB = Platform.OS === 'web';
