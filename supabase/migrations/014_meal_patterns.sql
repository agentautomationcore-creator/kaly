-- AI meal memory: track eating patterns by time of day
CREATE TABLE IF NOT EXISTS meal_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  food_name_en TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  frequency INT NOT NULL DEFAULT 1,
  last_logged_at TIMESTAMPTZ DEFAULT now(),
  food_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- One pattern per user + food + meal_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_meal_patterns_user_food_meal
  ON meal_patterns (user_id, food_name_en, meal_type);

-- Fast lookup for suggestions
CREATE INDEX IF NOT EXISTS idx_meal_patterns_user_meal_freq
  ON meal_patterns (user_id, meal_type, frequency DESC);

-- RLS
ALTER TABLE meal_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own patterns"
  ON meal_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own patterns"
  ON meal_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns"
  ON meal_patterns FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger: auto-update meal_patterns when a diary entry is inserted
CREATE OR REPLACE FUNCTION update_meal_pattern()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO meal_patterns (user_id, food_name, food_name_en, meal_type, frequency, last_logged_at, food_data)
  VALUES (
    NEW.user_id,
    NEW.food_name,
    COALESCE(NEW.food_name_en, NEW.food_name),
    NEW.meal_type,
    1,
    now(),
    jsonb_build_object(
      'food_items', COALESCE(NEW.food_items, '[]'::jsonb),
      'quantity_g', NEW.quantity_g,
      'total_calories', NEW.total_calories,
      'total_protein', NEW.total_protein,
      'total_carbs', NEW.total_carbs,
      'total_fat', NEW.total_fat,
      'total_fiber', NEW.total_fiber,
      'entry_method', NEW.entry_method,
      'confidence', NEW.confidence
    )
  )
  ON CONFLICT (user_id, food_name_en, meal_type)
  DO UPDATE SET
    frequency = meal_patterns.frequency + 1,
    last_logged_at = now(),
    food_name = NEW.food_name,
    food_data = jsonb_build_object(
      'food_items', COALESCE(NEW.food_items, '[]'::jsonb),
      'quantity_g', NEW.quantity_g,
      'total_calories', NEW.total_calories,
      'total_protein', NEW.total_protein,
      'total_carbs', NEW.total_carbs,
      'total_fat', NEW.total_fat,
      'total_fiber', NEW.total_fiber,
      'entry_method', NEW.entry_method,
      'confidence', NEW.confidence
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_meal_pattern
  AFTER INSERT ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_meal_pattern();
