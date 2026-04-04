-- A5: Add missing consent columns + fix RLS gaps

-- Add analytics consent columns to nutrition_profiles
ALTER TABLE nutrition_profiles
  ADD COLUMN IF NOT EXISTS analytics_consent_given boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS analytics_consent_at timestamptz;

-- Index for compliance audits
CREATE INDEX IF NOT EXISTS idx_nutrition_profiles_consent
  ON nutrition_profiles (user_id) WHERE ai_consent_given = true OR health_consent_given = true;

-- rate_limits: deny all direct access (already has RLS enabled in 005, add explicit deny policy)
CREATE POLICY IF NOT EXISTS "Rate limits service role only" ON rate_limits
  FOR ALL USING (false) WITH CHECK (false);

-- ai_feedback: add SELECT + DELETE for own rows
CREATE POLICY IF NOT EXISTS "Users can view their feedback" ON ai_feedback
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their feedback" ON ai_feedback
  FOR DELETE USING (auth.uid() = user_id);
