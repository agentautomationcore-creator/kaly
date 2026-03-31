// A11: Single source of truth — re-export from lib/types
import type { FoodItem, ScanResult } from '../../lib/types';
export type { FoodItem, ScanResult };

export interface ScanState {
  photo: string | null;
  result: ScanResult | null;
  isAnalyzing: boolean;
  portionMultiplier: number;
  error: string | null;
}
