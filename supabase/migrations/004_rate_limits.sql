-- Migration 004: Persistent rate limiting via Supabase RPC
-- Replaces in-memory Map() which resets on Edge Function cold starts

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (key)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max_count INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_entry RECORD;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT count, window_start INTO v_entry
  FROM rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (p_key, 1, v_now)
    ON CONFLICT (key) DO UPDATE
      SET count = 1, window_start = v_now;
    RETURN TRUE;
  END IF;

  IF v_now > v_entry.window_start + (p_window_seconds || ' seconds')::INTERVAL THEN
    UPDATE rate_limits
    SET count = 1, window_start = v_now
    WHERE key = p_key;
    RETURN TRUE;
  END IF;

  IF v_entry.count >= p_max_count THEN
    RETURN FALSE;
  END IF;

  UPDATE rate_limits
  SET count = count + 1
  WHERE key = p_key;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < now() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
