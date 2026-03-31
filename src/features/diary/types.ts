// A11: Single source of truth — re-export from lib/types
import type { DiaryEntry, WaterEntry } from '../../lib/types';
export type { DiaryEntry, WaterEntry };

export interface DayData {
  entries: DiaryEntry[];
  waterMl: number;
  waterEntries: WaterEntry[];
}
