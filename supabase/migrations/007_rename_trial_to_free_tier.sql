-- D2: Rename trial_start_date to free_tier_start
-- Apple requires trials go through StoreKit/RevenueCat, not DB-side tracking
ALTER TABLE nutrition_profiles
  RENAME COLUMN trial_start_date TO free_tier_start;

-- Update the view that references the old column name
CREATE OR REPLACE VIEW user_access AS
SELECT
  id,
  plan,
  (plan = 'pro' OR free_tier_start + interval '7 days' > now()) AS has_access
FROM nutrition_profiles;
