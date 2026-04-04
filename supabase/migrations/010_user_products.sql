-- 010_user_products.sql
-- Crowdsourced product database: users add products, everyone can search them

CREATE TABLE IF NOT EXISTS user_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid REFERENCES auth.users ON DELETE SET NULL,
  barcode text,
  name text NOT NULL CHECK (char_length(name) >= 2),
  brand text,
  calories_per_100g numeric NOT NULL DEFAULT 0 CHECK (calories_per_100g >= 0 AND calories_per_100g <= 1200),
  protein_per_100g numeric DEFAULT 0 CHECK (protein_per_100g >= 0 AND protein_per_100g <= 120),
  carbs_per_100g numeric DEFAULT 0 CHECK (carbs_per_100g >= 0 AND carbs_per_100g <= 120),
  fat_per_100g numeric DEFAULT 0 CHECK (fat_per_100g >= 0 AND fat_per_100g <= 120),
  serving_size text DEFAULT '100g',
  language text DEFAULT 'en',
  verified boolean DEFAULT false,
  use_count int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: everyone can READ, authenticated can INSERT, only creator can UPDATE/DELETE
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read user products"
  ON user_products FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add products"
  ON user_products FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creator can update own products"
  ON user_products FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete own products"
  ON user_products FOR DELETE
  USING (auth.uid() = created_by);

-- Index for text search
CREATE INDEX idx_user_products_name ON user_products USING gin (to_tsvector('simple', name));
CREATE INDEX idx_user_products_barcode ON user_products (barcode) WHERE barcode IS NOT NULL;

-- Increment use_count when someone adds this product to diary
CREATE OR REPLACE FUNCTION increment_product_use(p_product_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE user_products SET use_count = use_count + 1, updated_at = now()
  WHERE id = p_product_id;
END;
$$;
