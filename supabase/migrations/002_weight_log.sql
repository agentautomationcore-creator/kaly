-- Weight tracking over time
CREATE TABLE weight_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  logged_at   date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg   decimal(5,1) NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, logged_at)
);

CREATE INDEX weight_log_user_date ON weight_log(user_id, logged_at DESC);

ALTER TABLE weight_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their weight log"
  ON weight_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
