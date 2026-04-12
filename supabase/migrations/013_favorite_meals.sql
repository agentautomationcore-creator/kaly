-- Favorite meals: user can star meals for quick re-logging
CREATE TABLE IF NOT EXISTS favorite_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  food_name_en TEXT NOT NULL,
  food_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique per user + food name
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_meals_user_food
  ON favorite_meals (user_id, food_name_en);

-- RLS
ALTER TABLE favorite_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON favorite_meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorite_meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorite_meals FOR DELETE
  USING (auth.uid() = user_id);
