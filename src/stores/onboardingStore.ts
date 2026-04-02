import { create } from 'zustand';
import type { Gender, ActivityLevel, Goal, DietType } from '../lib/nutrition';

interface OnboardingState {
  goal: Goal | null;
  gender: Gender | null;
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  activityLevel: ActivityLevel;
  dietType: DietType;
  allergies: string[];

  setGoal: (goal: Goal) => void;
  setBody: (data: { gender: Gender; heightCm: number; weightKg: number; age: number; activityLevel: ActivityLevel }) => void;
  setDiet: (dietType: DietType, allergies: string[]) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  goal: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  age: null,
  activityLevel: 'moderate',
  dietType: 'balanced',
  allergies: [],

  setGoal: (goal) => set({ goal }),

  setBody: ({ gender, heightCm, weightKg, age, activityLevel }) =>
    set({ gender, heightCm, weightKg, age, activityLevel }),

  setDiet: (dietType, allergies) => set({ dietType, allergies }),

  reset: () => set({
    goal: null, gender: null, heightCm: null, weightKg: null, age: null,
    activityLevel: 'moderate', dietType: 'balanced', allergies: [],
  }),
}));
