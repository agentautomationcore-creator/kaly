import { create } from 'zustand';
import type { ScanResult, ScanState, FoodItem } from '../types';

interface ScanStore extends ScanState {
  isEdited: boolean;
  setPhoto: (uri: string | null) => void;
  setResult: (result: ScanResult | null) => void;
  setAnalyzing: (v: boolean) => void;
  setPortionMultiplier: (v: number) => void;
  setError: (e: string | null) => void;
  updateDishName: (name: string) => void;
  updateItem: (index: number, updates: Partial<FoodItem>) => void;
  removeItem: (index: number) => void;
  addItem: (item: FoodItem) => void;
  reset: () => void;
}

const initial: ScanState = {
  photo: null,
  result: null,
  isAnalyzing: false,
  portionMultiplier: 1,
  error: null,
};

function recalcTotals(items: FoodItem[]): ScanResult['total'] {
  return {
    calories: items.reduce((s, i) => s + i.calories, 0),
    protein_g: items.reduce((s, i) => s + i.protein_g, 0),
    fat_g: items.reduce((s, i) => s + i.fat_g, 0),
    carbs_g: items.reduce((s, i) => s + i.carbs_g, 0),
    fiber_g: items.reduce((s, i) => s + i.fiber_g, 0),
  };
}

export const useScanStore = create<ScanStore>((set, get) => ({
  ...initial,
  isEdited: false,
  setPhoto: (photo) => set({ photo, result: null, error: null, isEdited: false }),
  setResult: (result) => set({ result, isAnalyzing: false, isEdited: false }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setPortionMultiplier: (portionMultiplier) => set({ portionMultiplier }),
  setError: (error) => set({ error, isAnalyzing: false }),

  updateDishName: (name) => {
    const r = get().result;
    if (!r) return;
    set({ result: { ...r, dish_name: name }, isEdited: true });
  },

  updateItem: (index, updates) => {
    const r = get().result;
    if (!r) return;
    const items = [...r.items];
    const old = items[index];
    if (!old) return;

    // If grams changed, proportionally recalculate macros
    if (updates.g !== undefined && updates.g !== old.g && old.g > 0) {
      const ratio = updates.g / old.g;
      items[index] = {
        ...old,
        ...updates,
        calories: Math.round(old.calories * ratio),
        protein_g: +(old.protein_g * ratio).toFixed(1),
        fat_g: +(old.fat_g * ratio).toFixed(1),
        carbs_g: +(old.carbs_g * ratio).toFixed(1),
        fiber_g: +(old.fiber_g * ratio).toFixed(1),
      };
    } else {
      items[index] = { ...old, ...updates };
    }

    const total = recalcTotals(items);
    const totalG = items.reduce((s, i) => s + i.g, 0);
    set({ result: { ...r, items, total, total_portion_g: totalG }, isEdited: true });
  },

  removeItem: (index) => {
    const r = get().result;
    if (!r) return;
    const items = r.items.filter((_, i) => i !== index);
    const total = recalcTotals(items);
    const totalG = items.reduce((s, i) => s + i.g, 0);
    set({ result: { ...r, items, total, total_portion_g: totalG }, isEdited: true });
  },

  addItem: (item) => {
    const r = get().result;
    if (!r) return;
    const items = [...r.items, item];
    const total = recalcTotals(items);
    const totalG = items.reduce((s, i) => s + i.g, 0);
    set({ result: { ...r, items, total, total_portion_g: totalG }, isEdited: true });
  },

  reset: () => set({ ...initial, isEdited: false }),
}));
