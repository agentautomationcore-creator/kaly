-- 009_final_fixes.sql
-- FIX 1.1: check_daily_scan_limit — entry_method 'photo' not 'ai_scan' (ai_scan not in CHECK constraint)
-- FIX 1.6: sync_plan_from_purchase — add p_plan validation
-- FIX 2.18: webhook_events dedup table for RevenueCat

-- 1. Fix scan limit: use 'photo' entry_method (matches CHECK constraint on diary_entries)
CREATE OR REPLACE FUNCTION check_daily_scan_limit(p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_plan text;
  v_free_tier_start timestamptz;
  v_today_count int;
  v_limit int;
  v_is_pro boolean;
BEGIN
  SELECT plan, free_tier_start INTO v_plan, v_free_tier_start
  FROM nutrition_profiles WHERE id = p_user_id;

  v_is_pro := (v_plan = 'pro') OR (v_free_tier_start + interval '7 days' > now());
  IF v_is_pro THEN v_limit := 50; ELSE v_limit := 3; END IF;

  SELECT count(*) INTO v_today_count
  FROM diary_entries
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('day', now())
    AND entry_method = 'photo';

  RETURN json_build_object('allowed', v_today_count < v_limit, 'used', v_today_count, 'limit', v_limit, 'plan', v_plan);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix plan validation in sync_plan_from_purchase
CREATE OR REPLACE FUNCTION sync_plan_from_purchase(
  p_plan text DEFAULT 'pro',
  p_source text DEFAULT 'client_purchase'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_plan NOT IN ('pro', 'free') THEN
    RAISE EXCEPTION 'Invalid plan: %', p_plan;
  END IF;
  UPDATE nutrition_profiles SET plan = p_plan, updated_at = now()
  WHERE user_id = auth.uid() AND plan != p_plan;
END;
$$;

GRANT EXECUTE ON FUNCTION sync_plan_from_purchase TO authenticated;

-- 3. Webhook dedup table (for RevenueCat webhook idempotency)
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text UNIQUE NOT NULL,
  source text NOT NULL DEFAULT 'revenuecat',
  processed_at timestamptz DEFAULT now()
);
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- Deny all direct client access — only service role via Edge Functions
CREATE POLICY "webhook_events_deny_all" ON webhook_events FOR ALL USING (false) WITH CHECK (false);
