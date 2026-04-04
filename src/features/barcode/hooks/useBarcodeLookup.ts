import { createMMKV } from 'react-native-mmkv';
import { captureException } from '../../../lib/sentry';
import { supabase } from '../../../lib/supabase';

const cache = createMMKV({ id: 'kaly-barcode-cache' });
const CACHE_MAX = 100;
const CACHE_INDEX_KEY = 'barcode_index';

export interface BarcodeProduct {
  barcode: string;
  name: string;
  calories100g: number;
  protein100g: number;
  fat100g: number;
  carbs100g: number;
  imageUrl?: string;
  source: 'openfoodfacts' | 'manual';
}

function getCacheIndex(): string[] {
  const raw = cache.getString(CACHE_INDEX_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function setCacheIndex(index: string[]) {
  cache.set(CACHE_INDEX_KEY, JSON.stringify(index));
}

function getFromCache(barcode: string): BarcodeProduct | null {
  const raw = cache.getString(`bc_${barcode}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveToCache(product: BarcodeProduct) {
  cache.set(`bc_${product.barcode}`, JSON.stringify(product));
  const index = getCacheIndex().filter((b) => b !== product.barcode);
  index.unshift(product.barcode);
  // Keep only last CACHE_MAX
  while (index.length > CACHE_MAX) {
    const removed = index.pop();
    if (removed) cache.set(`bc_${removed}`, '');
  }
  setCacheIndex(index);
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  // Check local cache first
  const cached = getFromCache(barcode);
  if (cached) return cached;

  // Query Open Food Facts API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments || {};

    // SEC-3: Clamp values from external API to sane ranges
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    const product: BarcodeProduct = {
      barcode,
      name: p.product_name || p.product_name_en || barcode,
      calories100g: clamp(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0, 0, 1000),
      protein100g: clamp(n.proteins_100g ?? 0, 0, 100),
      fat100g: clamp(n.fat_100g ?? 0, 0, 100),
      carbs100g: clamp(n.carbohydrates_100g ?? 0, 0, 100),
      imageUrl: p.image_front_small_url,
      source: 'openfoodfacts',
    };

    saveToCache(product);
    return product;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return null;
    captureException(e, { feature: 'barcode_lookup', barcode });
  }

  // Fallback: search community DB by barcode
  try {
    const { data } = await supabase
      .from('user_products')
      .select('barcode, name, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g')
      .eq('barcode', barcode)
      .order('use_count', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const product: BarcodeProduct = {
        barcode,
        name: data.name,
        calories100g: Math.round(data.calories_per_100g),
        protein100g: Math.round(data.protein_per_100g || 0),
        fat100g: Math.round(data.fat_per_100g || 0),
        carbs100g: Math.round(data.carbs_per_100g || 0),
        source: 'manual',
      };
      saveToCache(product);
      return product;
    }
  } catch {
    // Community lookup failed — fall through to null
  }

  return null;
}
