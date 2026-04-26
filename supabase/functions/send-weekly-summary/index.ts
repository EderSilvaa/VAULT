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

  // Last 7 days window
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weekAgoIso = weekAgo.toISOString()

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  // Fetch all profiles
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, email')

  if (!profiles?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders })
  }

  let sent = 0
  const errors: string[] = []

  for (const profile of profiles as any[]) {
    if (!profile.email) continue

    // Fetch this user's transactions for the last 7 days
    const { data: transactions } = await adminClient
      .from('transactions')
      .select('type, amount, description, category, date')
      .eq('user_id', profile.id)
      .gte('date', weekAgoIso)
      .order('date', { ascending: false })

    if (!transactions?.length) continue // skip users with no activity this week

    const income = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((s: number, t: any) => s + Number(t.amount), 0)

    const expense = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((s: number, t: any) => s + Number(t.amount), 0)

    const balance = income - expense

    // Top 3 expenses
    const topExpenses = transactions
      .filter((t: any) => t.type === 'expense')
      .sort((a: any, b: any) => Number(b.amount) - Number(a.amount))
      .slice(0, 3)

    // Category breakdown
    const catMap = new Map<string, number>()
    transactions
      .filter((t: any) => t.type === 'expense')
      .forEach((t: any) => {
        catMap.set(t.category, (catMap.get(t.category) || 0) + Number(t.amount))
      })
    const topCats = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    const balanceColor = balance >= 0 ? '#16a34a' : '#dc2626'
    const balanceIcon = balance >= 0 ? '📈' : '📉'

    const topExpensesHtml = topExpenses.length > 0
      ? topExpenses.map((t: any) =>
          `<tr>
            <td style="padding: 6px 0; color: #555; font-size: 13px;">${t.description?.slice(0, 35) || '—'}</td>
            <td style="padding: 6px 0; color: #dc2626; font-size: 13px; text-align: right; font-weight: 600;">${brl(Number(t.amount))}</td>
          </tr>`
        ).join('')
      : '<tr><td colspan="2" style="color: #999; font-size: 13px; padding: 6px 0;">Nenhuma despesa esta semana 🎉</td></tr>'

    const catsHtml = topCats.length > 0
      ? topCats.map(([cat, val]) =>
          `<span style="display: inline-block; background: #f3f4f6; border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #555; margin: 3px 3px 3px 0;">${cat}: ${brl(val)}</span>`
        ).join('')
      : ''

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

    <div style="background: linear-gradient(135deg, #8c23f5, #6730a1); padding: 24px 32px;">
      <p style="color: rgba(255,255,255,0.75); font-size: 12px; margin: 0 0 4px; letter-spacing: 0.5px;">VAULT · RESUMO SEMANAL</p>
      <h1 style="color: white; font-size: 20px; margin: 0; font-weight: 700;">
        ${fmtDate(weekAgo)} – ${fmtDate(now)}
      </h1>
    </div>

    <div style="padding: 24px 32px;">

      <!-- KPIs -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        <div style="background: #f0fdf4; border-radius: 8px; padding: 12px; text-align: center;">
          <p style="color: #16a34a; font-size: 10px; font-weight: 700; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Entrou</p>
          <p style="color: #15803d; font-size: 16px; font-weight: 700; margin: 0;">${brl(income)}</p>
        </div>
        <div style="background: #fef2f2; border-radius: 8px; padding: 12px; text-align: center;">
          <p style="color: #dc2626; font-size: 10px; font-weight: 700; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Saiu</p>
          <p style="color: #b91c1c; font-size: 16px; font-weight: 700; margin: 0;">${brl(expense)}</p>
        </div>
        <div style="background: #f8f4ff; border-radius: 8px; padding: 12px; text-align: center;">
          <p style="color: #6730a1; font-size: 10px; font-weight: 700; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Saldo</p>
          <p style="color: ${balanceColor}; font-size: 16px; font-weight: 700; margin: 0;">${balanceIcon} ${brl(Math.abs(balance))}</p>
        </div>
      </div>

      <!-- Top despesas -->
      <h3 style="color: #333; font-size: 13px; font-weight: 700; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Maiores despesas</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        ${topExpensesHtml}
      </table>

      ${catsHtml ? `
      <!-- Categorias -->
      <h3 style="color: #333; font-size: 13px; font-weight: 700; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Por categoria</h3>
      <div style="margin-bottom: 24px;">${catsHtml}</div>
      ` : ''}

      <!-- CTA -->
      <a href="https://vault.tec.br/dashboard" style="display: block; background: #8c23f5; color: white; text-decoration: none; padding: 13px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center;">
        Ver dashboard completo →
      </a>

    </div>

    <div style="padding: 14px 32px; border-top: 1px solid #f0f0f0;">
      <p style="color: #bbb; font-size: 11px; margin: 0;">
        Vault · <a href="https://vault.tec.br" style="color: #8c23f5; text-decoration: none;">vault.tec.br</a>
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
          from: 'Vault <resumo@vault.tec.br>',
          to: [profile.email],
          subject: `${balanceIcon} Sua semana no Vault: ${brl(income)} entraram, ${brl(expense)} saíram`,
          html,
        }),
      })
      if (res.ok) sent++
      else errors.push(`${profile.email}: ${await res.text()}`)
    } catch (err: any) {
      errors.push(`${profile.email}: ${err.message}`)
    }
  }

  console.log(`[send-weekly-summary] sent:${sent} errors:${errors.length}`)

  return new Response(
    JSON.stringify({ sent, errors: errors.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
