-- 011_fix_sync_plan_where_clause.sql
-- FIX: sync_plan_from_purchase used WHERE user_id = auth.uid()
-- but nutrition_profiles PK is "id", not "user_id" (regression from 009)

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
  WHERE id = auth.uid() AND plan != p_plan;
END;
$$;
