-- Run once on your Postgres (Neon / Render / local).
-- Makes AI Control + Platform Settings persist on Render (disk is ephemeral).

CREATE TABLE IF NOT EXISTS platform_settings (
  id          text PRIMARY KEY,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (id, data) VALUES
  ('platform', '{}'::jsonb),
  ('ai', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- No other DB changes required for this design pass.
-- Balance adjust uses existing trading_accounts + transactions.
-- AI user toggle uses existing clients.tags JSON (value: "ai_enabled").
