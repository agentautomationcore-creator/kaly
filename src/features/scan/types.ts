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
  hidden: boolean;
}

export interface ScanResult {
  dish_name: string;
  dish_name_en: string;
  total_portion_g: number;
  confidence: number;
  total: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
  };
  items: FoodItem[];
  preparation: string;
  cuisine: string;
  warnings: string[];
  notes: string;
  cached?: boolean;
}

export interface ScanState {
  photo: string | null;
  result: ScanResult | null;
  isAnalyzing: boolean;
  portionMultiplier: number;
  error: string | null;
}
