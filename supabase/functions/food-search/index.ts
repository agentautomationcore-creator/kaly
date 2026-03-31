import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'app.kaly.mobile',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// S5: Rate limiting 30 req/min per user
const userRateLimits = new Map<string, { count: number; resetAt: number }>();
const USER_LIMIT = 30;
const USER_WINDOW_MS = 60 * 1000; // 1 minute

function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userRateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    userRateLimits.set(userId, { count: 1, resetAt: now + USER_WINDOW_MS });
    return true;
  }
  if (entry.count >= USER_LIMIT) return false;
  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // S5: Check rate limit
    if (!checkUserRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Search Open Food Facts
    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments,serving_size,image_front_small_url`;

    const response = await fetch(offUrl);
    const data = await response.json();

    interface OffProduct {
      product_name?: string;
      serving_size?: string;
      image_front_small_url?: string;
      nutriments?: Record<string, number>;
    }

    const products = (data.products || []).map((p: OffProduct) => ({
      name: p.product_name || 'Unknown',
      serving_size: p.serving_size || '100g',
      image_url: p.image_front_small_url || null,
      nutrition_per_100g: {
        calories: p.nutriments?.['energy-kcal_100g'] || 0,
        protein_g: p.nutriments?.proteins_100g || 0,
        fat_g: p.nutriments?.fat_100g || 0,
        carbs_g: p.nutriments?.carbohydrates_100g || 0,
        fiber_g: p.nutriments?.fiber_100g || 0,
      },
    }));

    return new Response(JSON.stringify({ products }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('food-search error:', error);
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
