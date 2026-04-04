-- B1/SEC-1: Enable RLS on rate_limits (deny all direct access, only via SECURITY DEFINER)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No RLS policies = deny all direct client access. Access only via check_rate_limit() SECURITY DEFINER.

-- CON-3: Add consent tracking columns to nutrition_profiles
-- These columns ensure consent survives app reinstalls (MMKV is device-local)

ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS ai_consent_given BOOLEAN DEFAULT FALSE;
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS ai_consent_at TIMESTAMPTZ;
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS health_consent_given BOOLEAN DEFAULT FALSE;
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS health_consent_at TIMESTAMPTZ;

-- SEC-8: RPC for client-side plan sync fallback (called after purchasePackage)
-- SECURITY DEFINER ensures only this function can update plan, not direct client writes
CREATE OR REPLACE FUNCTION sync_plan_from_purchase(
  p_plan text DEFAULT 'pro',
  p_source text DEFAULT 'client_purchase'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow 'pro' or 'free' values
  IF p_plan NOT IN ('pro', 'free') THEN
    RAISE EXCEPTION 'Invalid plan value';
  END IF;

  UPDATE nutrition_profiles
  SET plan = p_plan,
      updated_at = now()
  WHERE user_id = auth.uid()
    AND plan != p_plan;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION sync_plan_from_purchase TO authenticated;
