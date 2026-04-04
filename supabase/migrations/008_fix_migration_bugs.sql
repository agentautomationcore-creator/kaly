-- ============================================
-- FIX 1: protect_sensitive_fields() — trial_start_date → free_tier_start
-- Без этого: ВСЕ UPDATE на nutrition_profiles падают после миграции 007
-- ============================================
CREATE OR REPLACE FUNCTION protect_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Protect plan and free_tier_start from client-side changes
  IF current_setting('role') != 'service_role' THEN
    NEW.plan := OLD.plan;
    NEW.free_tier_start := OLD.free_tier_start;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIX 2: check_daily_scan_limit() — trial_start_date → free_tier_start
-- Без этого: проверка лимита сканов падает для всех юзеров
-- ============================================
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

  IF v_is_pro THEN
    v_limit := 50;
  ELSE
    v_limit := 3;
  END IF;

  SELECT count(*) INTO v_today_count
  FROM diary_entries
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('day', now())
    AND entry_method = 'ai_scan';

  RETURN json_build_object(
    'allowed', v_today_count < v_limit,
    'used', v_today_count,
    'limit', v_limit,
    'plan', v_plan
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIX 3: sync_plan_from_purchase() — user_id → id
-- Без этого: покупка Pro не синхронизируется в БД
-- ============================================
CREATE OR REPLACE FUNCTION sync_plan_from_purchase(
  p_plan text DEFAULT 'pro',
  p_source text DEFAULT 'client_purchase'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE nutrition_profiles
  SET plan = p_plan,
      updated_at = now()
  WHERE id = auth.uid()
    AND plan != p_plan;
END;
$$;

-- ============================================
-- FIX 4: Пересоздать индекс с правильным именем колонки (id, не user_id)
-- ============================================
DROP INDEX IF EXISTS idx_nutrition_profiles_consent;
CREATE INDEX idx_nutrition_profiles_consent
  ON nutrition_profiles (id) WHERE ai_consent_given = true OR health_consent_given = true;

-- ============================================
-- FIX 5: RLS policies для ai_feedback (если 006 не применилась из-за бага)
-- ============================================
DO $$
BEGIN
  -- rate_limits deny-all (idempotent)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rate_limits' AND policyname = 'Rate limits deny all') THEN
    CREATE POLICY "Rate limits deny all" ON rate_limits FOR ALL USING (false) WITH CHECK (false);
  END IF;

  -- ai_feedback SELECT
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_feedback' AND policyname = 'Users can view their feedback') THEN
    CREATE POLICY "Users can view their feedback" ON ai_feedback FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- ai_feedback DELETE
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_feedback' AND policyname = 'Users can delete their feedback') THEN
    CREATE POLICY "Users can delete their feedback" ON ai_feedback FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- FIX 6: analytics_consent columns (если 006 не применилась)
-- ============================================
ALTER TABLE nutrition_profiles
  ADD COLUMN IF NOT EXISTS analytics_consent_given boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS analytics_consent_at timestamptz;
