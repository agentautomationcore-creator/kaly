import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'kaly-fasting' });

interface FastingState {
  isActive: boolean;
  startTime: number | null;
  targetHours: number;
  start: (targetHours?: number) => void;
  stop: () => void;
  setTargetHours: (hours: number) => void;
}

export const useFastingStore = create<FastingState>((set) => ({
  isActive: storage.getBoolean('fasting_active') ?? false,
  startTime: storage.getNumber('fasting_start') || null,
  targetHours: storage.getNumber('fasting_target') || 16,

  start: (targetHours?: number) => {
    const now = Date.now();
    const hours = targetHours ?? storage.getNumber('fasting_target') ?? 16;
    storage.set('fasting_active', true);
    storage.set('fasting_start', now);
    storage.set('fasting_target', hours);
    set({ isActive: true, startTime: now, targetHours: hours });
  },

  stop: () => {
    storage.set('fasting_active', false);
    storage.set('fasting_start', 0);
    set({ isActive: false, startTime: null });
  },

  setTargetHours: (hours: number) => {
    storage.set('fasting_target', hours);
    set({ targetHours: hours });
  },
}));
