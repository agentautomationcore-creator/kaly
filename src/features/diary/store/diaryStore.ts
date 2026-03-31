import { create } from 'zustand';

interface DiaryStore {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export const useDiaryStore = create<DiaryStore>((set) => ({
  selectedDate: todayStr(),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}));
