-- User email learning rules
-- Populated when user corrects category/type in the review screen.
-- Injected as high-priority context in the AI prompt on next scan.

CREATE TABLE IF NOT EXISTS user_email_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'sender_domain': matches emails from a domain (e.g. "inter.co")
  -- 'description_contains': matches transactions whose description includes the value
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('sender_domain', 'description_contains')),
  trigger_value TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  match_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, trigger_type, trigger_value)
);

ALTER TABLE user_email_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own email rules" ON user_email_rules;
DROP POLICY IF EXISTS "Users can delete own email rules" ON user_email_rules;

CREATE POLICY "Users can view own email rules"
  ON user_email_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email rules"
  ON user_email_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Upserts go through Edge Function (service_role) or frontend with anon key
CREATE POLICY "Users can insert own email rules"
  ON user_email_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email rules"
  ON user_email_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_email_rules_user_id_idx ON user_email_rules(user_id);
