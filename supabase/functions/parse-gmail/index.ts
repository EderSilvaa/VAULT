import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedTransaction {
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  source: string
}

// ──────────────────────────────────────────────────────────────────────
// Gmail search query
// ──────────────────────────────────────────────────────────────────────
const SEARCH_TERMS = [
  'subject:"nota fiscal"', 'subject:"NF-e"', 'subject:"NFe"',
  'subject:"PIX recebido"', 'subject:"PIX enviado"',
  'subject:"Pix recebido"', 'subject:"Pix enviado"',
  'subject:"pagamento confirmado"', 'subject:"pagamento recebido"',
  'subject:"boleto pago"', 'subject:"boleto compensado"',
  'subject:"comprovante de transferência"',
  'subject:"transferência recebida"', 'subject:"transferência enviada"',
  'subject:"fatura"', 'subject:"extrato"',
]
const GMAIL_QUERY = SEARCH_TERMS.join(' OR ')

// ──────────────────────────────────────────────────────────────────────
// FIX 1: HTML → plain text (proper entity decoding + block tags)
// ──────────────────────────────────────────────────────────────────────
function htmlToText(html: string): string {
  return html
    // Block elements → newline
    .replace(/<(br|BR)\s*\/?>/g, '\n')
    .replace(/<\/(p|P|div|DIV|tr|TR|li|LI|h[1-6]|H[1-6])>/g, '\n')
    .replace(/<(td|TD|th|TH)[^>]*>/g, ' ')
    // Strip all remaining tags
    .replace(/<[^>]+>/g, '')
    // HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&[a-z]+;/g, ' ')
    // Normalize whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ──────────────────────────────────────────────────────────────────────
// Decode base64url email body part
// ──────────────────────────────────────────────────────────────────────
function decodeBody(data: string): string {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
    // Handle UTF-8 properly
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  } catch {
    return ''
  }
}

// ──────────────────────────────────────────────────────────────────────
// Recursively extract text from MIME parts (plain > HTML fallback)
// ──────────────────────────────────────────────────────────────────────
function extractText(payload: any): string {
  if (!payload) return ''

  // Prefer plain text
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBody(payload.body.data)
  }

  // Recurse into multipart
  if (payload.parts) {
    // First pass: look for plain text
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBody(part.body.data)
      }
    }
    // Second pass: recurse deeper
    for (const part of payload.parts) {
      const text = extractText(part)
      if (text) return text
    }
  }

  // Fallback: HTML → text
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return htmlToText(decodeBody(payload.body.data))
  }

  return ''
}

// ──────────────────────────────────────────────────────────────────────
// FIX 2: Smart value selection
// Find ALL monetary values, score by context, return best match
// ──────────────────────────────────────────────────────────────────────
interface ValueCandidate {
  value: number
  score: number
}

function extractBestAmount(text: string): number {
  const lines = text.split('\n')
  const candidates: ValueCandidate[] = []

  // High-priority: labeled values
  const labeledPatterns = [
    { re: /valor\s+total[^R\d]*R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i, score: 10 },
    { re: /total\s+da\s+nota[^R\d]*R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i, score: 10 },
    { re: /total\s+nf[^R\d]*R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i, score: 10 },
    { re: /valor\s+do\s+pix[^R\d]*R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i, score: 9 },
    { re: /valor\s+da\s+transfer[^R\d]*R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i, score: 9 },
    { re: /valor\s+cobrado[^R\d]*R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i, score: 9 },
    { re: /valor\s+pago[^R\d]*R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i, score: 9 },
    { re: /\btotal[:\s]+R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i, score: 8 },
    { re: /\bvalor[:\s]+R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i, score: 7 },
    { re: /\bimporte[:\s]+R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i, score: 7 },
    { re: /\bquantia[:\s]+R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i, score: 7 },
  ]

  for (const { re, score } of labeledPatterns) {
    const m = re.exec(text)
    if (m) {
      const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'))
      if (val > 0 && val < 10_000_000) candidates.push({ value: val, score })
    }
  }

  // Medium-priority: R$ anywhere
  const rsBrPattern = /R\$\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/g
  let m: RegExpExecArray | null
  while ((m = rsBrPattern.exec(text)) !== null) {
    const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'))
    if (val > 0 && val < 10_000_000) {
      // Bonus if on a line with "total"
      const lineStart = text.lastIndexOf('\n', m.index)
      const lineEnd = text.indexOf('\n', m.index)
      const line = text.slice(lineStart, lineEnd).toLowerCase()
      const bonus = /total|valor|pix|transfer/.test(line) ? 3 : 0
      candidates.push({ value: val, score: 5 + bonus })
    }
  }

  if (candidates.length === 0) return 0

  // Return value with highest score (ties broken by largest value)
  candidates.sort((a, b) => b.score - a.score || b.value - a.value)
  return candidates[0].value
}

// ──────────────────────────────────────────────────────────────────────
// Detect income vs expense
// ──────────────────────────────────────────────────────────────────────
function detectType(subject: string, body: string): 'income' | 'expense' {
  const combined = (subject + ' ' + body).toLowerCase()
  const incomeSignals = [
    'recebid', 'recebimento', 'creditad', 'depósito recebido',
    'pix recebido', 'transferência recebida', 'pagamento recebido',
    'cobrança recebida', 'venda aprovada', 'crédito em conta',
  ]
  const expenseSignals = [
    'enviado', 'debitad', 'pago', 'pagamento efetuado', 'débito',
    'pix enviado', 'transferência enviada', 'boleto pago',
    'compra aprovada', 'fatura', 'cobrança', 'débito em conta',
  ]
  const inc = incomeSignals.filter(s => combined.includes(s)).length
  const exp = expenseSignals.filter(s => combined.includes(s)).length
  return inc >= exp ? 'income' : 'expense'
}

// ──────────────────────────────────────────────────────────────────────
// Auto-categorize
// ──────────────────────────────────────────────────────────────────────
function detectCategory(text: string): string {
  const t = text.toLowerCase()
  if (/aluguel|locação|condomínio/.test(t)) return 'Fixo'
  if (/energia|luz|água|internet|telefone|gás|celular/.test(t)) return 'Utilidades'
  if (/fornecedor|material|insumo|compra de produto/.test(t)) return 'Fornecedores'
  if (/cliente|serviço prestado|venda|receita/.test(t)) return 'Vendas'
  if (/salário|prolabore|pró-labore|funcionário|folha/.test(t)) return 'Pessoal'
  if (/imposto|das|simples|inss|irpj|cofins|pis|iss/.test(t)) return 'Impostos'
  if (/manutenção|reparo|conserto/.test(t)) return 'Manutenção'
  if (/marketing|publicidade|anúncio/.test(t)) return 'Marketing'
  return 'Outros'
}

// ──────────────────────────────────────────────────────────────────────
// FIX 3: Token refresh using refresh_token + Google OAuth endpoint
// ──────────────────────────────────────────────────────────────────────
async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) return null

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

// ──────────────────────────────────────────────────────────────────────
// Parse single message → transaction or null
// ──────────────────────────────────────────────────────────────────────
function parseMessage(msg: any): ParsedTransaction | null {
  const headers: Array<{ name: string; value: string }> = msg.payload?.headers || []
  const subject = headers.find(h => h.name === 'Subject')?.value || ''
  const from = headers.find(h => h.name === 'From')?.value || ''
  const dateHeader = headers.find(h => h.name === 'Date')?.value || ''

  const body = extractText(msg.payload)
  const combined = subject + '\n' + body

  const amount = extractBestAmount(combined)
  if (amount === 0) return null

  const senderName = from.replace(/<.*>/, '').replace(/"/g, '').trim()
  const description = subject.substring(0, 80) || senderName || 'E-mail financeiro'

  let date = new Date().toISOString()
  try {
    const parsed = new Date(dateHeader)
    if (!isNaN(parsed.getTime())) date = parsed.toISOString()
  } catch { /* keep default */ }

  return {
    type: detectType(subject, body),
    amount,
    description,
    category: detectCategory(combined),
    date,
    source: `Gmail: ${senderName || from}`,
  }
}

// ──────────────────────────────────────────────────────────────────────
// FIX 4: Fetch all pages (up to 200 messages) via nextPageToken
// ──────────────────────────────────────────────────────────────────────
async function listAllMessages(token: string, query: string, maxTotal = 200): Promise<string[]> {
  const ids: string[] = []
  let pageToken: string | undefined

  while (ids.length < maxTotal) {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
    url.searchParams.set('q', query)
    url.searchParams.set('maxResults', '50')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) break

    const data = await res.json()
    const batch: string[] = (data.messages ?? []).map((m: any) => m.id)
    ids.push(...batch)

    if (!data.nextPageToken || batch.length === 0) break
    pageToken = data.nextPageToken
  }

  return ids.slice(0, maxTotal)
}

// Fetch messages in parallel batches to avoid timeouts
async function fetchMessages(ids: string[], token: string, batchSize = 10): Promise<any[]> {
  const results: any[] = []
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)
    const fetched = await Promise.all(
      batch.map(async (id) => {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        return res.ok ? res.json() : null
      })
    )
    results.push(...fetched.filter(Boolean))
  }
  return results
}

// ──────────────────────────────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { provider_token, provider_refresh_token, days = 90 } = await req.json()

    if (!provider_token && !provider_refresh_token) {
      return new Response(
        JSON.stringify({ error: 'Gmail não conectado. Conecte sua conta Google.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // FIX 3: Try to get a valid token — refresh if needed
    let accessToken: string = provider_token
    let tokenRefreshed = false

    if (!accessToken && provider_refresh_token) {
      const refreshed = await refreshGoogleToken(provider_refresh_token)
      if (!refreshed) {
        return new Response(
          JSON.stringify({ error: 'Sessão do Gmail expirada. Reconecte sua conta Google.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      accessToken = refreshed
      tokenRefreshed = true
    }

    // FIX 4: Build query with date filter and paginate
    const afterEpoch = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60
    const query = `(${GMAIL_QUERY}) after:${afterEpoch}`

    const ids = await listAllMessages(accessToken, query, 200)

    // If token expired mid-request, refresh and retry listing
    if (ids.length === 0 && provider_refresh_token && !tokenRefreshed) {
      const refreshed = await refreshGoogleToken(provider_refresh_token)
      if (refreshed) {
        accessToken = refreshed
        const retryIds = await listAllMessages(accessToken, query, 200)
        ids.push(...retryIds)
        tokenRefreshed = true
      }
    }

    // Fetch full messages in parallel batches
    const messages = await fetchMessages(ids, accessToken)

    const transactions: ParsedTransaction[] = []
    for (const msg of messages) {
      const parsed = parseMessage(msg)
      if (parsed) transactions.push(parsed)
    }

    // Sort by date desc
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return new Response(
      JSON.stringify({
        transactions,
        scanned: messages.length,
        found: transactions.length,
        token_refreshed: tokenRefreshed,
        new_access_token: tokenRefreshed ? accessToken : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
