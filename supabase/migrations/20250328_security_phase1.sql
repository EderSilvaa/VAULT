-- Migration: Security Phase 1 - Fix critical vulnerabilities
-- Date: 2026-03-28
-- Issues: items 1, 2, 3, 4 from code review

-- ============================================================
-- ITEM 1: Revoke dangerous broad GRANT ALL for anon/authenticated
-- Original in: 20250126_fix_trigger_final.sql (lines 35-36)
-- Problem: GRANT ALL ON ALL TABLES/SEQUENCES to anon and authenticated
--          bypasses RLS and gives full DDL/DML access.
-- Fix: Revoke ALL, then grant only USAGE on schema and
--      let RLS policies control table-level access.
-- ============================================================

-- Revoke the overly broad grants
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Grant only schema usage (needed to see tables exist)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant row-level operations on tables (RLS policies enforce per-row access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- anon only needs SELECT on specific tables if any (none currently needed)
-- If signup trigger needs anon insert on profiles, that runs as SECURITY DEFINER
-- so it executes with the function owner's privileges, not anon's.

-- Ensure future tables follow the same pattern
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;


-- ============================================================
-- ITEM 2: Fix IDOR in SECURITY DEFINER RPCs that accept p_user_id
-- Problem: Functions trust caller-supplied p_user_id without checking auth.uid()
-- Fix: Replace p_user_id usage with auth.uid() internally, keeping the
--      parameter for backward compatibility but ignoring it.
-- ============================================================

-- 2a. get_latest_analysis: ignore p_user_id, use auth.uid()
CREATE OR REPLACE FUNCTION get_latest_analysis(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  analysis_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  current_balance NUMERIC,
  insights JSONB,
  balance_prediction JSONB,
  anomalies JSONB,
  spending_patterns JSONB,
  unread_alerts INTEGER
) AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.analysis_date,
    a.status,
    a.current_balance,
    a.insights,
    a.balance_prediction,
    a.anomalies,
    a.spending_patterns,
    (SELECT COUNT(*)::INTEGER FROM ai_alerts WHERE ai_alerts.user_id = v_uid AND is_read = FALSE) as unread_alerts
  FROM ai_analysis_results a
  WHERE a.user_id = v_uid AND a.status = 'completed'
  ORDER BY a.analysis_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2b. mark_alert_read: validate ownership via auth.uid()
CREATE OR REPLACE FUNCTION mark_alert_read(p_alert_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE ai_alerts
  SET is_read = TRUE, read_at = NOW()
  WHERE id = p_alert_id AND user_id = v_uid;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2c. get_notification_preferences: use auth.uid() instead of p_user_id
CREATE OR REPLACE FUNCTION get_notification_preferences(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  enabled BOOLEAN,
  alert_cash_low BOOLEAN,
  alert_goals_progress BOOLEAN,
  alert_analysis_ready BOOLEAN,
  alert_recurring_payment BOOLEAN,
  alert_anomaly_detected BOOLEAN,
  daily_digest BOOLEAN,
  daily_digest_time TIME,
  weekly_summary BOOLEAN,
  weekly_summary_day INTEGER,
  weekly_summary_time TIME,
  quiet_hours_enabled BOOLEAN,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  push_subscription JSONB
) AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    np.id,
    np.enabled,
    np.alert_cash_low,
    np.alert_goals_progress,
    np.alert_analysis_ready,
    np.alert_recurring_payment,
    np.alert_anomaly_detected,
    np.daily_digest,
    np.daily_digest_time,
    np.weekly_summary,
    np.weekly_summary_day,
    np.weekly_summary_time,
    np.quiet_hours_enabled,
    np.quiet_hours_start,
    np.quiet_hours_end,
    np.push_subscription
  FROM notification_preferences np
  WHERE np.user_id = v_uid;

  -- If user doesn't have preferences yet, create defaults
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (v_uid)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN QUERY
    SELECT
      np.id,
      np.enabled,
      np.alert_cash_low,
      np.alert_goals_progress,
      np.alert_analysis_ready,
      np.alert_recurring_payment,
      np.alert_anomaly_detected,
      np.daily_digest,
      np.daily_digest_time,
      np.weekly_summary,
      np.weekly_summary_day,
      np.weekly_summary_time,
      np.quiet_hours_enabled,
      np.quiet_hours_start,
      np.quiet_hours_end,
      np.push_subscription
    FROM notification_preferences np
    WHERE np.user_id = v_uid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2d. save_notification_history: use auth.uid() instead of p_user_id
CREATE OR REPLACE FUNCTION save_notification_history(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_channel TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_notification_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO notification_history (user_id, type, title, message, channel, data)
  VALUES (v_uid, p_type, p_title, p_message, p_channel, p_data)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- ITEM 4: Restrict expiring_consents view
-- Problem: SELECT bc.* exposes all columns; GRANT to authenticated
--          lets any user see all other users' rows.
-- Fix: Project only needed columns and filter by auth.uid().
-- ============================================================

-- Drop and recreate with restricted columns and row-level filter
CREATE OR REPLACE VIEW expiring_consents AS
SELECT
  bc.id,
  bc.user_id,
  bc.pluggy_item_id,
  bc.connector_name,
  bc.status,
  bc.consent_given_at,
  bc.consent_expires_at,
  (bc.consent_expires_at - NOW()) as time_until_expiration
FROM bank_connections bc
WHERE bc.user_id = auth.uid()
  AND bc.consent_expires_at IS NOT NULL
  AND bc.consent_expires_at > NOW()
  AND bc.consent_expires_at <= (NOW() + INTERVAL '30 days')
ORDER BY bc.consent_expires_at ASC;

-- Re-grant (view now self-filters by auth.uid())
GRANT SELECT ON expiring_consents TO authenticated;
