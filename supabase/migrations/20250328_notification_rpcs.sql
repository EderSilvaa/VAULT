-- Migration: Notification Scheduler RPCs
-- Date: 2026-03-28
-- Creates the 3 RPCs called by notification-scheduler.service.ts that were missing:
--   get_cash_projection, get_daily_summary, get_weekly_summary

-- ============================================================
-- RPC: get_cash_projection
-- Called by: notification-scheduler.service.ts:145
-- Returns: daily balance projection for the next N days based on
--          recent income/expense averages.
-- ============================================================
CREATE OR REPLACE FUNCTION get_cash_projection(
  p_user_id UUID,
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
  day_date DATE,
  balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_current_balance NUMERIC;
  v_avg_daily_income NUMERIC;
  v_avg_daily_expense NUMERIC;
  v_net_daily NUMERIC;
  v_period_start DATE;
BEGIN
  -- Only allow users to query their own projection
  IF v_uid IS NULL OR v_uid <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Use last 90 days to compute averages
  v_period_start := CURRENT_DATE - INTERVAL '90 days';

  SELECT
    COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) / 90, 0),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) / 90, 0)
  INTO v_avg_daily_income, v_avg_daily_expense
  FROM transactions
  WHERE user_id = p_user_id
    AND date >= v_period_start::TIMESTAMPTZ;

  v_net_daily := v_avg_daily_income - v_avg_daily_expense;

  -- Current balance = total income - total expenses (all time)
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
  INTO v_current_balance
  FROM transactions
  WHERE user_id = p_user_id;

  -- Generate projection rows
  RETURN QUERY
  SELECT
    (CURRENT_DATE + (gs.day || ' days')::INTERVAL)::DATE AS day_date,
    ROUND(v_current_balance + (gs.day * v_net_daily), 2)  AS balance
  FROM generate_series(1, p_days_ahead) AS gs(day);
END;
$$;


-- ============================================================
-- RPC: get_daily_summary
-- Called by: notification-scheduler.service.ts:231
-- Returns: today's income, expenses, and running balance.
-- ============================================================
CREATE OR REPLACE FUNCTION get_daily_summary(
  p_user_id UUID
)
RETURNS TABLE (
  income  NUMERIC,
  expenses NUMERIC,
  balance  NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_today_start TIMESTAMPTZ := date_trunc('day', NOW());
  v_today_end   TIMESTAMPTZ := v_today_start + INTERVAL '1 day';
BEGIN
  IF v_uid IS NULL OR v_uid <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income'  AND date >= v_today_start AND date < v_today_end THEN amount ELSE 0 END), 0) AS income,
    COALESCE(SUM(CASE WHEN type = 'expense' AND date >= v_today_start AND date < v_today_end THEN amount ELSE 0 END), 0) AS expenses,
    -- Running balance (all time)
    COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS balance
  FROM transactions
  WHERE user_id = p_user_id;
END;
$$;


-- ============================================================
-- RPC: get_weekly_summary
-- Called by: notification-scheduler.service.ts:258
-- Returns: this week's income, expenses, savings, and ending balance.
-- ============================================================
CREATE OR REPLACE FUNCTION get_weekly_summary(
  p_user_id UUID
)
RETURNS TABLE (
  income          NUMERIC,
  expenses        NUMERIC,
  savings         NUMERIC,
  ending_balance  NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_week_start TIMESTAMPTZ := date_trunc('week', NOW());
  v_week_end   TIMESTAMPTZ := v_week_start + INTERVAL '7 days';
BEGIN
  IF v_uid IS NULL OR v_uid <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH weekly AS (
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income'  AND date >= v_week_start AND date < v_week_end THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' AND date >= v_week_start AND date < v_week_end THEN amount ELSE 0 END), 0) AS expenses
    FROM transactions
    WHERE user_id = p_user_id
  ),
  total AS (
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS balance
    FROM transactions
    WHERE user_id = p_user_id
  )
  SELECT
    w.income,
    w.expenses,
    w.income - w.expenses AS savings,
    t.balance             AS ending_balance
  FROM weekly w, total t;
END;
$$;
