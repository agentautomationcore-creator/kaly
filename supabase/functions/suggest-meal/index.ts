import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // Auth: anon key + user JWT (same pattern as analyze-food, no service_role)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response('Unauthorized', { status: 401 });

    // Consent check: both health + AI required for meal suggestions
    const { data: profile } = await supabase
      .from('nutrition_profiles')
      .select('health_consent_given, ai_consent_given')
      .eq('id', user.id)
      .single();

    if (!profile?.health_consent_given || !profile?.ai_consent_given) {
      return new Response(JSON.stringify({ error: 'Consent required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: 10 suggestions per hour
    const { data: rateCheck } = await supabase.rpc('check_rate_limit', {
      p_key: `suggest-meal:${user.id}`,
      p_max_count: 10,
      p_window_seconds: 3600,
    });
    if (!rateCheck) {
      return new Response(JSON.stringify({ error: 'RATE_LIMIT' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      remaining_calories,
      remaining_protein,
      remaining_carbs,
      remaining_fat,
      meal_type,
      dietary_preferences,
      allergies,
      language,
    } = body;

    // Model from env, default to Haiku for cost efficiency
    const model = Deno.env.get('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';

    const systemPrompt = `You are a nutritionist AI. You suggest practical, easy-to-make meals.
Always respond with ONLY a JSON array of exactly 3 objects. No markdown, no explanation.
Each object must have: name (string), description (string, 1 sentence), calories (number), protein (number), carbs (number), fat (number), ingredients (array of strings, max 10).
Respond in the language specified by the user.`;

    const userPrompt = `Suggest 3 meal options for ${meal_type || 'a meal'}.

Remaining budget today:
- Calories: ${remaining_calories ?? 'unknown'} kcal
- Protein: ${remaining_protein ?? '?'}g, Carbs: ${remaining_carbs ?? '?'}g, Fat: ${remaining_fat ?? '?'}g

Dietary preferences: ${dietary_preferences || 'none'}
Allergies: ${allergies || 'none'}
Language: ${language || 'en'}

Example format:
[{"name":"Grilled chicken salad","description":"Light and protein-rich salad.","calories":350,"protein":35,"carbs":15,"fat":12,"ingredients":["chicken breast","lettuce","tomato","olive oil"]}]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const aiData = await response.json();
    const text = aiData.content?.[0]?.text || '[]';

    // Parse JSON safely
    let suggestions;
    try {
      const cleaned = text.replace(/```json\n?|```/g, '').trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      suggestions = [];
    }

    // Validate AI response
    if (!Array.isArray(suggestions)) {
      return new Response(JSON.stringify({ error: 'Invalid AI response' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    suggestions = suggestions.filter((s: Record<string, unknown>) => s && typeof s.name === 'string' && s.name.length > 0).slice(0, 5);

    // Clamp values
    suggestions = suggestions.slice(0, 3).map((s: Record<string, unknown>) => ({
      name: String(s.name || 'Meal'),
      description: String(s.description || ''),
      calories: Math.max(0, Math.min(2000, Number(s.calories) || 0)),
      protein: Math.max(0, Math.min(200, Number(s.protein) || 0)),
      carbs: Math.max(0, Math.min(500, Number(s.carbs) || 0)),
      fat: Math.max(0, Math.min(200, Number(s.fat) || 0)),
      ingredients: Array.isArray(s.ingredients) ? s.ingredients.map(String).slice(0, 10) : [],
    }));

    return new Response(JSON.stringify({ suggestions }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('suggest-meal error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
