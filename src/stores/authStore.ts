import { create } from 'zustand';
import { FREE_SCANS_PER_DAY, FREE_TRIAL_DAYS } from '../lib/constants';
import type { NutritionProfile } from '../lib/types';

interface AuthState {
  user: { id: string; email?: string } | null;
  profile: NutritionProfile | null;
  isAnonymous: boolean;
  isLoading: boolean;

  setUser: (user: AuthState['user']) => void;
  setProfile: (profile: NutritionProfile | null) => void;
  setIsAnonymous: (isAnonymous: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;

  isPro: () => boolean;
  isTrialActive: () => boolean;
  canScan: (todayScans: number) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAnonymous: true,
  isLoading: true,

  setUser: (user) => set({ user, isAnonymous: !user?.email }),
  setProfile: (profile) => set({ profile }),
  setIsAnonymous: (isAnonymous) => set({ isAnonymous }),
  setIsLoading: (isLoading) => set({ isLoading }),

  isPro: () => {
    const { profile } = get();
    if (!profile) return false;
    if (profile.plan === 'pro') return true;
    // Check in-app trial
    return get().isTrialActive();
  },

  isTrialActive: () => {
    const { profile } = get();
    if (!profile?.trial_start_date) return false;
    const trialEnd = new Date(profile.trial_start_date);
    trialEnd.setDate(trialEnd.getDate() + FREE_TRIAL_DAYS);
    return new Date() < trialEnd;
  },

  canScan: (todayScans: number) => {
    const { isPro } = get();
    if (isPro()) return true;
    return todayScans < FREE_SCANS_PER_DAY;
  },
}));
