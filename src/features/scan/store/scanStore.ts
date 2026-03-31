import { create } from 'zustand';
import type { ScanResult, ScanState } from '../types';

interface ScanStore extends ScanState {
  setPhoto: (uri: string | null) => void;
  setResult: (result: ScanResult | null) => void;
  setAnalyzing: (v: boolean) => void;
  setPortionMultiplier: (v: number) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

const initial: ScanState = {
  photo: null,
  result: null,
  isAnalyzing: false,
  portionMultiplier: 1,
  error: null,
};

export const useScanStore = create<ScanStore>((set) => ({
  ...initial,
  setPhoto: (photo) => set({ photo, result: null, error: null }),
  setResult: (result) => set({ result, isAnalyzing: false }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setPortionMultiplier: (portionMultiplier) => set({ portionMultiplier }),
  setError: (error) => set({ error, isAnalyzing: false }),
  reset: () => set(initial),
}));
