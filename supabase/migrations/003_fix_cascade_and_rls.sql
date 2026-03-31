-- GDPR-6: Fix ai_feedback foreign key — SET NULL → CASCADE
ALTER TABLE ai_feedback
  DROP CONSTRAINT ai_feedback_user_id_fkey,
  ADD CONSTRAINT ai_feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add columns needed by updated feedback button (NutritionResultCard)
ALTER TABLE ai_feedback
  ADD COLUMN IF NOT EXISTS food_name text,
  ADD COLUMN IF NOT EXISTS original_result jsonb;

-- Remove strict CHECK — feedback_type now receives localized strings
ALTER TABLE ai_feedback DROP CONSTRAINT IF EXISTS ai_feedback_feedback_type_check;

-- SEC-6: Improve trigger — use request.jwt.claim.role + SECURITY DEFINER
CREATE OR REPLACE FUNCTION protect_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_setting('request.jwt.claim.role', true) != 'service_role') THEN
    NEW.plan := OLD.plan;
    NEW.trial_start_date := OLD.trial_start_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
