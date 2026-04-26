import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const adminClient = createClient(supabaseUrl, serviceKey)

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const daysUntilDue = 20 - now.getDate()

  // Fetch all users with tax_settings (MEI/Simples)
  const { data: taxSettings } = await adminClient
    .from('tax_settings')
    .select('user_id')

  if (!taxSettings?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders })
  }

  const userIds = taxSettings.map((t: any) => t.user_id)

  // Fetch profiles (email) + DAS amounts for current month
  const [{ data: profiles }, { data: calculations }] = await Promise.all([
    adminClient.from('profiles').select('id, email').in('id', userIds),
    adminClient
      .from('tax_calculations')
      .select('user_id, das_amount')
      .in('user_id', userIds)
      .eq('month', month)
      .eq('year', year),
  ])

  const dasMap = new Map((calculations ?? []).map((c: any) => [c.user_id, Number(c.das_amount)]))

  let sent = 0
  const errors: string[] = []

  for (const profile of (profiles ?? []) as any[]) {
    if (!profile.email) continue

    const dasAmount = dasMap.get(profile.id)
    const amountLabel = dasAmount
      ? dasAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'a calcular'

    const urgencyLabel = daysUntilDue === 0 ? 'HOJE' : daysUntilDue === 1 ? 'amanhã' : `em ${daysUntilDue} dias`

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #8c23f5, #6730a1); padding: 28px 32px;">
      <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 4px;">Vault · Caixa Alerta</p>
      <h1 style="color: white; font-size: 22px; margin: 0;">⚠️ DAS vence ${urgencyLabel}</h1>
    </div>
    <div style="padding: 28px 32px;">
      <p style="color: #333; font-size: 16px; margin: 0 0 20px;">
        Seu DAS (Documento de Arrecadação do Simples Nacional) vence no dia <strong>20/${month.toString().padStart(2,'0')}/${year}</strong>.
      </p>
      <div style="background: #f8f4ff; border: 1px solid #d4b4fc; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="color: #6730a1; font-size: 13px; margin: 0 0 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Valor do DAS</p>
        <p style="color: #4a0e8f; font-size: 28px; font-weight: 700; margin: 0;">${amountLabel}</p>
      </div>
      <p style="color: #666; font-size: 14px; margin: 0 0 24px;">
        O pagamento em atraso gera multa de 0,33% ao dia (máximo 20%) + juros SELIC.<br>
        Pague pelo app do seu banco ou no site da Receita Federal.
      </p>
      <a href="https://vault.tec.br/dashboard/taxes" style="display: inline-block; background: #8c23f5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        Ver detalhes no Vault →
      </a>
    </div>
    <div style="padding: 16px 32px; border-top: 1px solid #f0f0f0;">
      <p style="color: #aaa; font-size: 12px; margin: 0;">
        Vault · <a href="https://vault.tec.br" style="color: #8c23f5; text-decoration: none;">vault.tec.br</a>
        &nbsp;·&nbsp;
        <a href="https://vault.tec.br/perfil?unsubscribe=das" style="color: #aaa; text-decoration: none;">Cancelar inscrição</a>
      </p>
    </div>
  </div>
</body>
</html>`

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Vault <alertas@vault.tec.br>',
          to: [profile.email],
          subject: `⚠️ DAS vence ${urgencyLabel} — ${amountLabel}`,
          html,
        }),
      })
      if (res.ok) sent++
      else errors.push(`${profile.email}: ${await res.text()}`)
    } catch (err: any) {
      errors.push(`${profile.email}: ${err.message}`)
    }
  }

  console.log(`[send-das-alert] sent:${sent} errors:${errors.length}`)

  return new Response(
    JSON.stringify({ sent, errors: errors.length, month, year }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
