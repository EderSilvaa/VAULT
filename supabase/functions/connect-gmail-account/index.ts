import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonError('Missing Authorization header', 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Validate user JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return jsonError('Invalid session', 401)

    const { code, redirect_uri } = await req.json()
    if (!code || !redirect_uri) return jsonError('Missing code or redirect_uri', 400)

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    if (!clientId || !clientSecret) return jsonError('Google OAuth not configured', 500)

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const text = await tokenRes.text()
      return jsonError(`Google token exchange failed: ${text}`, 400)
    }

    const tokenData = await tokenRes.json()
    const accessToken: string | undefined = tokenData.access_token
    const refreshToken: string | undefined = tokenData.refresh_token

    if (!refreshToken) {
      // Google only returns refresh_token on first consent. If user already authorized
      // this app+account before, force them to re-consent (frontend uses prompt=consent).
      return jsonError(
        'Refresh token não recebido. Desautorize o app em myaccount.google.com/permissions e tente de novo.',
        400
      )
    }

    // Fetch the email address of the authorized Gmail account
    const profileRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!profileRes.ok) return jsonError('Failed to fetch Gmail profile', 400)
    const profile = await profileRes.json()
    const email: string = profile.emailAddress

    // Upsert into gmail_accounts (service role bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceKey)
    const { error: upsertErr } = await adminClient
      .from('gmail_accounts')
      .upsert(
        {
          user_id: user.id,
          email,
          refresh_token: refreshToken,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,email' }
      )

    if (upsertErr) return jsonError(`DB error: ${upsertErr.message}`, 500)

    return new Response(
      JSON.stringify({ email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return jsonError(err.message ?? 'Unknown error', 500)
  }
})

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
