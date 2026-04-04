import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface FoodSearchItem {
  barcode: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_size: string;
  image_url: string | null;
  source?: 'openfoodfacts' | 'community';
  community_product_id?: string; // user_products.id for increment_product_use
}

/** Sanitize query for PostgREST ilike — strip wildcards */
function sanitizeQuery(q: string): string {
  return q.replace(/[%_]/g, '');
}

async function searchCommunityProducts(query: string): Promise<FoodSearchItem[]> {
  const clean = sanitizeQuery(query);
  if (clean.length < 2) return [];

  const { data, error } = await supabase
    .from('user_products')
    .select('id, barcode, name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_size')
    .or(`name.ilike.%${clean}%,brand.ilike.%${clean}%`)
    .order('use_count', { ascending: false })
    .limit(10);

  if (error || !data) return [];

  return data.map(p => ({
    barcode: p.barcode || '',
    name: p.name,
    brand: p.brand || '',
    calories: Math.round(p.calories_per_100g),
    protein: Math.round(p.protein_per_100g || 0),
    carbs: Math.round(p.carbs_per_100g || 0),
    fat: Math.round(p.fat_per_100g || 0),
    fiber: 0,
    serving_size: p.serving_size || '100g',
    image_url: null,
    source: 'community' as const,
    community_product_id: p.id,
  }));
}

async function searchOpenFoodFacts(query: string, signal: AbortSignal): Promise<FoodSearchItem[]> {
  const response = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,nutriments,serving_size,image_small_url`,
    { signal },
  );

  const data = await response.json();
  return (data.products || [])
    .filter((p: Record<string, unknown>) => p.product_name && p.nutriments)
    .map((p: Record<string, unknown>) => {
      const n = p.nutriments as Record<string, number>;
      return {
        barcode: (p.code as string) || '',
        name: (p.product_name as string) || '',
        brand: (p.brands as string) || '',
        calories: Math.round(n?.['energy-kcal_100g'] || 0),
        protein: Math.round(n?.proteins_100g || 0),
        carbs: Math.round(n?.carbohydrates_100g || 0),
        fat: Math.round(n?.fat_100g || 0),
        fiber: Math.round(n?.fiber_100g || 0),
        serving_size: (p.serving_size as string) || '100g',
        image_url: (p.image_small_url as string) || null,
        source: 'openfoodfacts' as const,
      };
    });
}

export function useFoodSearch() {
  const [results, setResults] = useState<FoodSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    try {
      const timeout = setTimeout(() => controller.abort(), 10000);

      // Search both sources in parallel
      const [offResults, communityResults] = await Promise.all([
        searchOpenFoodFacts(query, controller.signal),
        searchCommunityProducts(query),
      ]);
      clearTimeout(timeout);

      // Community results first (with badge), then OpenFoodFacts
      setResults([...communityResults, ...offResults]);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, isSearching, search, clear };
}
