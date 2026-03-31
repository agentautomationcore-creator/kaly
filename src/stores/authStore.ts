import { create } from 'zustand';
import { supabase } from '../lib/supabase';
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

  // A1: Core methods
  init: () => void;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  registerFromAnonymous: (email: string, password: string) => Promise<void>;

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

  // A1: Initialize auth — subscribe to auth state changes, load profile
  init: () => {
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = { id: session.user.id, email: session.user.email ?? undefined };
        const isAnon = !session.user.email;
        set({ user, isAnonymous: isAnon });

        // Load profile
        const { data } = await supabase
          .from('nutrition_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({ profile: data, isLoading: false });
      } else {
        set({ user: null, profile: null, isAnonymous: true, isLoading: false });
      }
    });

    // Also check current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = { id: session.user.id, email: session.user.email ?? undefined };
        set({ user, isAnonymous: !session.user.email });

        supabase
          .from('nutrition_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            set({ profile: data, isLoading: false });
          });
      } else {
        set({ isLoading: false });
      }
    });
  },

  // A1: Sign out and clear store
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, isAnonymous: true });
  },

  // Anonymous sign-in for onboarding
  signInAnonymously: async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (data.user) {
      set({
        user: { id: data.user.id, email: undefined },
        isAnonymous: true,
      });
    }
  },

  // A1: Upgrade anonymous → registered via updateUser (NOT signUp)
  registerFromAnonymous: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.updateUser({ email, password });
    if (error) throw error;
    if (data.user) {
      set({
        user: { id: data.user.id, email: data.user.email ?? undefined },
        isAnonymous: false,
      });
    }
  },

  isPro: () => {
    const { profile } = get();
    if (!profile) return false;
    if (profile.plan === 'pro') return true;
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
