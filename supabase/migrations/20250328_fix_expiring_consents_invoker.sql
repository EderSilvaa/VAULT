-- Fix: expiring_consents view must use SECURITY INVOKER (not DEFINER)
-- so that RLS policies on bank_connections are evaluated for the actual caller,
-- not the view creator. The WHERE clause already filters by auth.uid().

DROP VIEW IF EXISTS public.expiring_consents;

CREATE VIEW public.expiring_consents WITH (security_invoker = true) AS
SELECT
  bc.id,
  bc.user_id,
  bc.pluggy_item_id,
  bc.connector_name,
  bc.status,
  bc.consent_given_at,
  bc.consent_expires_at,
  (bc.consent_expires_at - NOW()) AS time_until_expiration
FROM bank_connections bc
WHERE bc.user_id = auth.uid()
  AND bc.consent_expires_at IS NOT NULL
  AND bc.consent_expires_at > NOW()
  AND bc.consent_expires_at <= (NOW() + INTERVAL '30 days')
ORDER BY bc.consent_expires_at ASC;

GRANT SELECT ON public.expiring_consents TO authenticated;
