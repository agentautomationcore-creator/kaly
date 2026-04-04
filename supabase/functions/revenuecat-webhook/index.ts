import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  // Fail-closed: no secret → 500
  const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('REVENUECAT_WEBHOOK_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate Bearer token
  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${webhookSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const event = (body as Record<string, unknown>)?.event as Record<string, unknown> | undefined;
  if (!event) {
    return new Response(JSON.stringify({ error: 'Missing event' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const eventType = event.type as string;
  const eventId = event.id as string | undefined;
  const appUserId = event.app_user_id as string | undefined;

  if (!appUserId) {
    return new Response(JSON.stringify({ error: 'Missing app_user_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Determine new plan based on event type
  let newPlan: string | null = null;
  switch (eventType) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
      newPlan = 'pro';
      break;
    case 'CANCELLATION':
    case 'EXPIRATION':
    case 'BILLING_ISSUE':
      newPlan = 'free';
      break;
    default:
      // Unknown event type — acknowledge but don't act
      return new Response(JSON.stringify({ ok: true, skipped: eventType }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  // Service role client — has elevated DB permissions for plan updates
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Dedup: skip if this event was already processed
  if (eventId) {
    const { data: existing } = await adminClient
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, deduplicated: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await adminClient.from('webhook_events').insert({
      event_id: eventId,
      source: 'revenuecat',
      processed_at: new Date().toISOString(),
    });
  }

  const { error } = await adminClient
    .from('nutrition_profiles')
    .update({ plan: newPlan })
    .eq('id', appUserId);

  if (error) {
    console.error('Failed to update plan:', error);
    return new Response(JSON.stringify({ error: 'DB update failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, plan: newPlan, user: appUserId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
