import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.30.1';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

const corsHeaders = {
  'Access-Control-Allow-Origin': 'app.kaly.mobile',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SEC-3: Rate limiting via Supabase RPC (not in-memory Map which resets on cold start)
// Uses per-user JWT-based limiting via check_daily_scan_limit RPC (below)
// For anonymous users, additional check via user ID (not spoofable IP)

// S9: Language allowlist to prevent prompt injection
const ALLOWED_LANGUAGES = ['en', 'fr', 'ru', 'de', 'es', 'it', 'ar', 'pt', 'tr', 'zh'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // S4: Check Content-Length before processing
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > 1_048_576) { // 1MB
      return new Response(JSON.stringify({ error: 'Request too large' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Verify JWT
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

    // GDPR Art.9: Verify health + AI consent before processing
    const { data: consentProfile } = await supabase
      .from('nutrition_profiles')
      .select('health_consent_given, ai_consent_given')
      .eq('id', user.id)
      .single();
    if (!consentProfile?.health_consent_given || !consentProfile?.ai_consent_given) {
      return new Response(JSON.stringify({ error: 'Consent required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Rate limit check (daily scan limit) — per-user via Supabase RPC
    const { data: canScan } = await supabase.rpc('check_daily_scan_limit', { p_user_id: user.id });
    if (!canScan) {
      return new Response(JSON.stringify({ error: 'Daily scan limit reached', limit: 3 }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image, language = 'en' } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: 'No image' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // S9: Validate language against allowlist
    const lang = ALLOWED_LANGUAGES.includes(language) ? language : 'en';

    // 3. Check cache
    const imageHash = await computeHash(image);
    const { data: cached } = await supabase
      .from('nutrition_cache')
      .select('*')
      .eq('image_hash', imageHash)
      .single();

    if (cached) {
      // Use service role client to update cache (RLS blocks anon inserts)
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await adminClient
        .from('nutrition_cache')
        .update({ scan_count: cached.scan_count + 1, last_used_at: new Date().toISOString() })
        .eq('id', cached.id);

      return new Response(JSON.stringify({
        dish_name: cached.food_name,
        dish_name_en: cached.food_name_en,
        total: cached.total_nutrition,
        items: cached.food_items,
        cached: true,
        confidence: cached.confidence,
        total_portion_g: cached.total_nutrition?.total_portion_g || 300,
        preparation: '',
        cuisine: '',
        warnings: [],
        notes: 'Cached result',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // S6: Insert pending diary entry BEFORE calling Claude (prevents TOCTOU race)
    const { data: pending } = await supabase.from('diary_entries').insert({
      user_id: user.id,
      meal_type: 'snack',
      food_name: 'Analyzing...',
      total_calories: 0,
      entry_method: 'photo',
    }).select('id').single();

    // 4. Claude Vision analysis with retry
    const prompt = buildPrompt(lang);
    let result: Record<string, unknown>;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
              { type: 'text', text: prompt },
            ],
          }],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        result = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
        break;
      } catch (e) {
        if (attempt === 1) {
          // S6: Delete pending entry on failure
          if (pending?.id) {
            await supabase.from('diary_entries').delete().eq('id', pending.id);
          }
          throw e;
        }
      }
    }

    // S6: Delete pending entry (caller will insert the real one via the app)
    if (pending?.id) {
      await supabase.from('diary_entries').delete().eq('id', pending.id);
    }

    // SEC-2: Validate AI output ranges to prevent cache poisoning
    if (result!.total) {
      const t = result!.total as Record<string, number>;
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
      t.calories = clamp(t.calories ?? 0, 0, 10000);
      t.protein_g = clamp(t.protein_g ?? 0, 0, 1000);
      t.fat_g = clamp(t.fat_g ?? 0, 0, 1000);
      t.carbs_g = clamp(t.carbs_g ?? 0, 0, 1000);
      t.fiber_g = clamp(t.fiber_g ?? 0, 0, 200);
    }
    if (Array.isArray(result!.items)) {
      for (const item of result!.items as Array<Record<string, unknown>>) {
        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
        item.calories = clamp((item.calories as number) ?? 0, 0, 10000);
        item.protein_g = clamp((item.protein_g as number) ?? 0, 0, 1000);
        item.fat_g = clamp((item.fat_g as number) ?? 0, 0, 1000);
        item.carbs_g = clamp((item.carbs_g as number) ?? 0, 0, 1000);
        item.fiber_g = clamp((item.fiber_g as number) ?? 0, 0, 200);
        item.g = clamp((item.g as number) ?? 0, 0, 5000);
      }
    }

    if (result!.error === 'not_food') {
      return new Response(JSON.stringify(result!), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Save to cache via admin client
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    await adminClient.from('nutrition_cache').upsert({
      image_hash: imageHash,
      food_name: result!.dish_name,
      food_name_en: result!.dish_name_en,
      food_items: result!.items,
      total_nutrition: { ...(result!.total as Record<string, unknown>), total_portion_g: result!.total_portion_g },
      confidence: result!.confidence,
    }, { onConflict: 'image_hash' });

    return new Response(JSON.stringify({ ...result!, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // S10: Never leak stack traces to client
    console.error('analyze-food error:', error);
    return new Response(JSON.stringify({ error: 'Analysis failed. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// S12: Use full base64 for hash, not just first 10KB
async function computeHash(base64: string): Promise<string> {
  const data = new TextEncoder().encode(base64);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function buildPrompt(language: string): string {
  return `You are a nutrition expert analyzing a food photo.
Return ONLY valid JSON. No markdown, no explanation, no backticks.

RULES:
- Include HIDDEN ingredients (oil, butter, sauces, dressings, sugar)
- Be conservative with portions (people underestimate by 20-30%)
- For restaurant dishes, estimate as typically served
- For packaged food, use standard serving size
- If the image is NOT food, return: {"error": "not_food", "message": "Not a food image"}
- If there are too many dishes to analyze (>5), focus on the most visible 3 dishes and add a warning

JSON FORMAT:
{
  "dish_name": "Name in ${language}",
  "dish_name_en": "English name",
  "total_portion_g": 350,
  "confidence": 0.88,
  "total": { "calories": 520, "protein_g": 28.5, "fat_g": 18.2, "carbs_g": 62.1, "fiber_g": 4.3 },
  "items": [
    { "name": "Ingredient in ${language}", "name_en": "English", "g": 180, "calories": 290, "protein_g": 24.0, "fat_g": 8.5, "carbs_g": 0, "fiber_g": 0, "confidence": 0.95, "hidden": false }
  ],
  "preparation": "grilled",
  "cuisine": "Italian",
  "warnings": [],
  "notes": "Sauce estimated at standard amount"
}`;
}
