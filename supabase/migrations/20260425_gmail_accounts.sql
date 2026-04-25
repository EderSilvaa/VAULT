-- Multi-account Gmail support
-- Each user can connect multiple Gmail addresses for parsing financial emails.
-- The OAuth flow that creates rows here is decoupled from Supabase Auth.

CREATE TABLE IF NOT EXISTS gmail_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_scan_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, email)
);

ALTER TABLE gmail_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own gmail accounts" ON gmail_accounts;
DROP POLICY IF EXISTS "Users can delete own gmail accounts" ON gmail_accounts;

CREATE POLICY "Users can view own gmail accounts"
  ON gmail_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gmail accounts"
  ON gmail_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- INSERT/UPDATE only via Edge Function with service_role (refresh tokens are sensitive)

CREATE INDEX IF NOT EXISTS gmail_accounts_user_id_idx ON gmail_accounts(user_id);
