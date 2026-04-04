import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { SUPABASE_URL } from '../lib/constants';

export interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
}

interface SuggestParams {
  remaining_calories: number;
  remaining_protein: number;
  remaining_carbs: number;
  remaining_fat: number;
  meal_type?: string;
  dietary_preferences?: string;
  allergies?: string;
  language: string;
}

// Simple cache: round values and store for 30 min
const cache = new Map<string, { suggestions: MealSuggestion[]; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function cacheKey(p: SuggestParams): string {
  // Round to nearest 50 kcal / 10g for macros
  const cal = Math.round((p.remaining_calories || 0) / 50) * 50;
  const prot = Math.round((p.remaining_protein || 0) / 10) * 10;
  const carb = Math.round((p.remaining_carbs || 0) / 10) * 10;
  const fat = Math.round((p.remaining_fat || 0) / 10) * 10;
  return `${cal}_${prot}_${carb}_${fat}_${p.meal_type || ''}_${p.language}`;
}

export function useMealSuggestions() {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const suggest = async (params: SuggestParams) => {
    // Check cache
    const key = cacheKey(params);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setSuggestions(cached.suggestions);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/suggest-meal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(params),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        if (response.status === 429) throw new Error('RATE_LIMIT');
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      const result = data.suggestions || [];
      setSuggestions(result);

      // Cache result
      cache.set(key, { suggestions: result, ts: Date.now() });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setSuggestions([]);
    setError(null);
  };

  return { suggestions, isLoading, error, suggest, clear };
}
