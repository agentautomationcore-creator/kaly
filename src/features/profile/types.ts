// A11: Single source of truth — re-export from lib/types
import type { NutritionProfile, WeightEntry } from '../../lib/types';
export type { NutritionProfile };

// WeightLogEntry matches WeightEntry but with different name convention in this feature
export type WeightLogEntry = WeightEntry;
