-- 012_analytics_consent.sql
-- Add analytics consent columns to nutrition_profiles for GDPR compliance

ALTER TABLE nutrition_profiles
  ADD COLUMN IF NOT EXISTS analytics_consent_given BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS analytics_consent_at TIMESTAMPTZ;
