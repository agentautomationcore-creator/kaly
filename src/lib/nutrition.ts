/**
 * TDEE Calculator — Mifflin-St Jeor equation (most accurate for general population)
 */

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';
export type DietType = 'balanced' | 'keto' | 'vegan' | 'vegetarian' | 'paleo' | 'pescatarian' | 'halal' | 'kosher' | 'custom';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel
): number {
  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateDailyTarget(tdee: number, goal: Goal): number {
  switch (goal) {
    case 'lose': return Math.round(tdee * 0.8);    // -20%
    case 'gain': return Math.round(tdee * 1.15);   // +15%
    default: return tdee;
  }
}

export function calculateMacroSplit(
  calories: number,
  diet: DietType
): { protein_g: number; carbs_g: number; fat_g: number } {
  const splits: Record<DietType, [number, number, number]> = {
    balanced:     [0.30, 0.40, 0.30],
    keto:         [0.25, 0.05, 0.70],
    vegan:        [0.20, 0.55, 0.25],
    vegetarian:   [0.25, 0.50, 0.25],
    paleo:        [0.35, 0.25, 0.40],
    pescatarian:  [0.30, 0.40, 0.30],
    halal:        [0.30, 0.40, 0.30],
    kosher:       [0.30, 0.40, 0.30],
    custom:       [0.30, 0.40, 0.30],
  };

  const [pPct, cPct, fPct] = splits[diet] || splits.balanced;

  return {
    protein_g: Math.round((calories * pPct) / 4),   // 4 kcal/g
    carbs_g: Math.round((calories * cPct) / 4),     // 4 kcal/g
    fat_g: Math.round((calories * fPct) / 9),       // 9 kcal/g
  };
}

/** Convert between metric and imperial */
export function lbsToKg(lbs: number): number { return Math.round(lbs * 0.453592 * 10) / 10; }
export function kgToLbs(kg: number): number { return Math.round(kg * 2.20462 * 10) / 10; }
export function inchesToCm(inches: number): number { return Math.round(inches * 2.54); }
export function cmToInches(cm: number): number { return Math.round(cm / 2.54 * 10) / 10; }
