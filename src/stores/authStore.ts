import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { FREE_SCANS_PER_DAY } from '../lib/constants';
import { identify, resetAnalytics } from '../lib/analytics';
import { setSentryUser } from '../lib/sentry';
import type { NutritionProfile } from '../lib/types';

const mmkv = createMMKV({ id: 'kaly-settings' });

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
  refreshAndRetry: () => Promise<boolean>;

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

        // Set user context for analytics & error tracking
        setSentryUser(session.user.id);
        if (!isAnon) {
          identify(session.user.id, { email: session.user.email });
        }

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

  // A1: Sign out and clear store + EDGE-4: clear all caches
  signOut: async () => {
    resetAnalytics();
    setSentryUser(null);
    await supabase.auth.signOut();
    queryClient.clear();
    mmkv.clearAll();
    set({ user: null, profile: null, isAnonymous: true });
  },

  // EDGE-2: Refresh expired session and retry once
  refreshAndRetry: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      // Session truly expired — sign out
      await get().signOut();
      return false;
    }
    return true;
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
    // Synced from entitlements via listener in _layout.tsx
    return profile.plan === 'pro';
  },

  isTrialActive: () => {
    // Managed by StoreKit. Entitlement 'pro' is active during trial.
    const { profile } = get();
    return profile?.plan === 'pro';
  },

  canScan: (todayScans: number) => {
    const { isPro } = get();
    if (isPro()) return true;
    return todayScans < FREE_SCANS_PER_DAY;
  },
}));
