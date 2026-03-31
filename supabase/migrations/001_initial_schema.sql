-- ============================================
-- KALY — Supabase Schema v1
-- ============================================

-- 1. Nutrition profile
CREATE TABLE nutrition_profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name      text,
  diet_type         text DEFAULT 'balanced',
  daily_calories    int DEFAULT 2000,
  protein_pct       int DEFAULT 30,
  carbs_pct         int DEFAULT 40,
  fat_pct           int DEFAULT 30,
  allergies         text[] DEFAULT '{}',
  custom_exclusions text[] DEFAULT '{}',
  goal              text DEFAULT 'maintain',
  height_cm         int,
  weight_kg         decimal(5,1),
  target_weight_kg  decimal(5,1),
  age               int,
  gender            text,
  activity_level    text DEFAULT 'moderate',
  units             text DEFAULT 'metric',
  language          text DEFAULT 'en',
  theme             text DEFAULT 'system',
  notifications     boolean DEFAULT true,
  water_goal_ml     int DEFAULT 2000,
  onboarding_done   boolean DEFAULT false,
  trial_start_date  timestamptz DEFAULT now(),
  plan              text DEFAULT 'free',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE nutrition_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their profile"
  ON nutrition_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Diary entries
CREATE TABLE diary_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  logged_at       date NOT NULL DEFAULT CURRENT_DATE,
  meal_type       text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  food_name       text NOT NULL,
  food_name_en    text,
  food_items      jsonb NOT NULL DEFAULT '[]',
  quantity_g      decimal(7,1),
  total_calories  decimal(7,1) NOT NULL DEFAULT 0,
  total_protein   decimal(7,1) DEFAULT 0,
  total_carbs     decimal(7,1) DEFAULT 0,
  total_fat       decimal(7,1) DEFAULT 0,
  total_fiber     decimal(7,1) DEFAULT 0,
  photo_url       text,
  confidence      decimal(3,2),
  entry_method    text DEFAULT 'photo' CHECK (entry_method IN ('photo','barcode','search','manual')),
  edited          boolean DEFAULT false,
  source_entry_id uuid REFERENCES diary_entries(id),
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX diary_entries_user_date ON diary_entries(user_id, logged_at DESC);
CREATE INDEX diary_entries_recent ON diary_entries(user_id, created_at DESC);

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their diary"
  ON diary_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Nutrition cache (server-side pHash)
CREATE TABLE nutrition_cache (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_hash      text NOT NULL UNIQUE,
  food_name       text,
  food_name_en    text,
  food_items      jsonb NOT NULL,
  total_nutrition jsonb NOT NULL,
  confidence      decimal(3,2),
  scan_count      int DEFAULT 1,
  last_used_at    timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE nutrition_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cache readable by authenticated" ON nutrition_cache FOR SELECT USING (auth.uid() IS NOT NULL);
-- Cache insertable only by service_role (Edge Functions use service_role key which bypasses RLS)
CREATE POLICY "Cache insertable by service role only" ON nutrition_cache FOR INSERT WITH CHECK (false);

-- 4. Water log
CREATE TABLE water_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  logged_at   date NOT NULL DEFAULT CURRENT_DATE,
  ml          int NOT NULL CHECK (ml > 0),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX water_log_user_date ON water_log(user_id, logged_at);

ALTER TABLE water_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their water log"
  ON water_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. AI Feedback
CREATE TABLE ai_feedback (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users ON DELETE SET NULL,
  diary_entry_id  uuid REFERENCES diary_entries ON DELETE SET NULL,
  feedback_type   text NOT NULL CHECK (feedback_type IN ('wrong_food','wrong_portion','wrong_calories','missing_ingredient','other')),
  description     text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can submit feedback"
  ON ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Server-side rate limiting function
CREATE OR REPLACE FUNCTION check_daily_scan_limit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  scan_count int;
  is_pro boolean;
BEGIN
  SELECT (plan = 'pro' OR trial_start_date + interval '7 days' > now())
  INTO is_pro FROM nutrition_profiles WHERE id = p_user_id;

  IF is_pro THEN RETURN true; END IF;

  SELECT COUNT(*) INTO scan_count
  FROM diary_entries
  WHERE user_id = p_user_id
    AND entry_method = 'photo'
    AND logged_at = CURRENT_DATE;

  RETURN scan_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S1/S7: Protect plan and trial_start_date from client-side updates
CREATE OR REPLACE FUNCTION protect_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role') != 'service_role' THEN
    NEW.plan := OLD.plan;
    NEW.trial_start_date := OLD.trial_start_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_plan_and_trial
  BEFORE UPDATE ON nutrition_profiles
  FOR EACH ROW EXECUTE FUNCTION protect_sensitive_fields();
