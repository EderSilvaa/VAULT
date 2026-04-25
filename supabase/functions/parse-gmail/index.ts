import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
  source_id: string
  confidence: 'high' | 'medium' | 'low'
  installment?: { current: number; total: number }
  isRecurring?: boolean
}

// ──────────────────────────────────────────────────────────────────────
// Gmail search queries — split into two strategies:
// 1. Known bank senders (high precision, always financial)
// 2. Keyword-based (broader, relies on parseMessage to filter noise)
// ──────────────────────────────────────────────────────────────────────
const BANK_SENDERS = [
  'nubank.com.br', 'inter.co', 'itau.com.br', 'itau-unibanco.com.br',
  'bradesco.com.br', 'santander.com.br', 'bb.com.br', 'caixa.gov.br',
  'bancointer.com.br', 'c6bank.com.br', 'mercadopago.com',
  'picpay.com', 'pagseguro.com.br', 'stone.com.br', 'sicredi.com.br',
  'sicoob.com.br', 'banrisul.com.br', 'safra.com.br', 'btg.com',
  'neon.com.br', 'will.com.vc', 'next.me',
  'xpi.com.br', 'btgpactual.com', 'cora.com.br',
  'contasimples.com.br', 'warren.com.br', 'modal.com.br', 'sofisa.com.br',
]
const BANK_QUERY = BANK_SENDERS.map(d => `from:${d}`).join(' OR ')

const KEYWORD_QUERY = [
  'pix', 'boleto', 'fatura', 'pagamento', 'transferencia',
  'transferência', 'comprovante', 'cobrança', 'cobranca',
  'extrato', 'recebido', 'creditado', 'debitado',
  'parcela', 'vencimento', 'emprestimo', 'empréstimo',
  'financiamento', 'mensalidade', 'assinatura', 'aluguel',
  'serasa', 'divida', 'dívida', 'negativacao',
  'nota fiscal', 'nfe',
].map(t => (t.includes(' ') ? `"${t}"` : t)).join(' OR ')

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

function extractBestAmount(text: string): { value: number; score: number } {
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

  // Medium-priority: R$ with cents (1.234,56)
  const rsBrPattern = /R\$\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/g
  let m: RegExpExecArray | null
  while ((m = rsBrPattern.exec(text)) !== null) {
    const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'))
    if (val > 0 && val < 10_000_000) {
      const lineStart = text.lastIndexOf('\n', m.index)
      const lineEnd = text.indexOf('\n', m.index)
      const line = text.slice(lineStart, lineEnd).toLowerCase()
      const bonus = /total|valor|pix|transfer/.test(line) ? 3 : 0
      candidates.push({ value: val, score: 5 + bonus })
    }
  }

  // R$ without cents (R$ 1.234 or R$ 150)
  const rsNoCentsPattern = /R\$\s*([\d]{1,3}(?:\.\d{3})*)(?![,\d])/g
  while ((m = rsNoCentsPattern.exec(text)) !== null) {
    const val = parseFloat(m[1].replace(/\./g, ''))
    if (val > 0 && val < 10_000_000) {
      candidates.push({ value: val, score: 3 })
    }
  }

  // "1.234,56 reais" (no R$ prefix)
  const reaisPattern = /([\d]{1,3}(?:\.\d{3})*,\d{2})\s*reais/gi
  while ((m = reaisPattern.exec(text)) !== null) {
    const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'))
    if (val > 0 && val < 10_000_000) {
      candidates.push({ value: val, score: 4 })
    }
  }

  // USD/EUR for international subscriptions (US$ 9.99, USD 29.90, € 14,99)
  const usdPattern = /(?:US\$|USD)\s*([\d]{1,6}(?:[.,]\d{2})?)/gi
  while ((m = usdPattern.exec(text)) !== null) {
    const val = parseFloat(m[1].replace(',', '.'))
    if (val > 0 && val < 100_000) {
      candidates.push({ value: val, score: 3 })
    }
  }
  const eurPattern = /€\s*([\d]{1,6}(?:[.,]\d{2})?)/g
  while ((m = eurPattern.exec(text)) !== null) {
    const val = parseFloat(m[1].replace(',', '.'))
    if (val > 0 && val < 100_000) {
      candidates.push({ value: val, score: 3 })
    }
  }

  if (candidates.length === 0) return { value: 0, score: 0 }

  // Return value with highest score (ties broken by largest value)
  candidates.sort((a, b) => b.score - a.score || b.value - a.value)
  return candidates[0]
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
    'parcela', 'vencimento', 'empréstimo', 'financiamento',
    'carnê', 'dívida', 'negativação', 'serasa', 'mensalidade',
    'assinatura', 'aluguel', 'condomínio', 'segunda via',
  ]
  const inc = incomeSignals.filter(s => combined.includes(s)).length
  const exp = expenseSignals.filter(s => combined.includes(s)).length
  // Default to expense on tie — most financial emails are bills/payments
  return inc > exp ? 'income' : 'expense'
}

// ──────────────────────────────────────────────────────────────────────
// Auto-categorize
// ──────────────────────────────────────────────────────────────────────
// Categories must match TRANSACTION_CATEGORIES in the frontend:
// Vendas, Fornecedores, Fixo, Variável, Receita, Salários, Aluguel, Serviços, Marketing, Impostos, Outros
function detectCategory(text: string): string {
  const t = text.toLowerCase()
  if (/aluguel|locação|condomínio/.test(t)) return 'Aluguel'
  if (/iptu|ipva|energia|luz|água|internet|telefone|gás|celular/.test(t)) return 'Fixo'
  if (/empréstimo|financiamento|parcela|carnê|dívida|renegoci|serasa|spc|negativação/.test(t)) return 'Fixo'
  if (/cartão de crédito|fatura mínima|pagamento mínimo/.test(t)) return 'Fixo'
  if (/assinatura|mensalidade|renovação|plano/.test(t)) return 'Fixo'
  if (/fornecedor|material|insumo|compra de produto/.test(t)) return 'Fornecedores'
  if (/cliente|serviço prestado|venda|receita|repasse/.test(t)) return 'Vendas'
  if (/salário|prolabore|pró-labore|funcionário|folha/.test(t)) return 'Salários'
  if (/imposto|das|simples|inss|irpj|cofins|pis|iss/.test(t)) return 'Impostos'
  if (/manutenção|reparo|conserto/.test(t)) return 'Serviços'
  if (/marketing|publicidade|anúncio/.test(t)) return 'Marketing'
  return 'Outros'
}

// ──────────────────────────────────────────────────────────────────────
// User pattern context — built from past imported transactions
// ──────────────────────────────────────────────────────────────────────
interface UserPattern {
  description: string
  category: string
  type: 'income' | 'expense'
  freq: number
}

function buildUserContext(patterns: UserPattern[], avgIncome: number, avgExpense: number): string {
  if (!patterns.length) return ''

  const lines = patterns
    .slice(0, 20)
    .map(p => `  - "${p.description}" → ${p.type === 'income' ? 'receita' : 'despesa'}, ${p.category} (${p.freq}x)`)
    .join('\n')

  const incomeStr = avgIncome > 0 ? `Receita média: R$${avgIncome.toFixed(0)}` : ''
  const expenseStr = avgExpense > 0 ? `Despesa média: R$${avgExpense.toFixed(0)}` : ''
  const stats = [incomeStr, expenseStr].filter(Boolean).join(' | ')

  return `\nPadrões anteriores deste usuário (use para categorizar melhor):\n${lines}${stats ? '\n  ' + stats : ''}`
}

// Bank-specific template parsers removed — AI handles all banks contextually.
// Kept: extractAmountSimple for fallback regex path.
function extractAmountSimple(text: string): number {
  const labeled = /(?:valor|total)[:\s]+R\$\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i.exec(text)
  if (labeled) return parseFloat(labeled[1].replace(/\./g, '').replace(',', '.'))
  const m = /R\$\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i.exec(text)
  return m ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) : 0
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
// Reject promotional / marketing / declined emails
// Returns true if the message should be SKIPPED
// ──────────────────────────────────────────────────────────────────────
function isPromotionalOrIrrelevant(msg: any, subject: string, body: string): boolean {
  // Gmail label check — CATEGORY_PROMOTIONS = marketing email
  const labels: string[] = msg.labelIds ?? []
  if (labels.includes('CATEGORY_PROMOTIONS') || labels.includes('CATEGORY_SOCIAL')) {
    // Allow through only if it contains a strong transactional signal
    const transactional = /recibo|comprovante|confirmação de pagamento|fatura paga|boleto pago|pix recebido|pix enviado|nota fiscal|nfe|extrato/i
    if (!transactional.test(subject + ' ' + body)) return true
  }

  // Hard-reject: transaction declined/failed
  const declined = /recusad|não autorizado|transação negada|pagamento recusado|falhou|não aprovado|cartão bloqueado|limite insuficiente/i
  if (declined.test(subject + ' ' + body)) return true

  // Hard-reject: promotional intent in subject (offers, deals, urgency)
  const promoSubject = /não perca|aproveite|oferta|promoção|desconto|economize|últimos dias|horas para|compre agora|clique aqui|saiba mais|elegível|grátis por|meses grátis|trial|experimente|black friday|cyber monday|semana do consumidor|você ganhou|ganhe|cupom/i
  if (promoSubject.test(subject)) return true

  return false
}

// ──────────────────────────────────────────────────────────────────────
// Extract a rich description from the email body
// Tries to find: PIX recipient/sender, establishment, boleto issuer
// ──────────────────────────────────────────────────────────────────────
function extractRichDescription(subject: string, body: string, senderName: string): string {
  const text = body.toLowerCase()

  // PIX: "pix para João Silva" / "pix de Maria Santos"
  const pixTo = /pix\s+(?:para|enviado\s+para|destinat[áa]rio)[:\s]+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){0,3})/i.exec(body)
  if (pixTo) return `PIX para ${pixTo[1].trim()}`

  const pixFrom = /pix\s+(?:de|recebido\s+de|remetente|pagador)[:\s]+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){0,3})/i.exec(body)
  if (pixFrom) return `PIX de ${pixFrom[1].trim()}`

  // Boleto: "boleto CPFL Energia" / "pagamento de boleto - Vivo"
  const boleto = /boleto\s+(?:de\s+|para\s+|-\s*)?([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){0,3})/i.exec(body)
  if (boleto) return `Boleto ${boleto[1].trim()}`

  // Fatura: "fatura do cartão Nubank" / "fatura Mastercard"
  const fatura = /fatura\s+(?:do\s+cart[ãa]o\s+)?(?:de\s+cr[ée]dito\s+)?([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){0,2})/i.exec(body)
  if (fatura) return `Fatura ${fatura[1].trim()}`

  // NF-e: "nota fiscal" + "razão social" or company name
  const nfe = /(?:raz[ãa]o\s+social|emitente|prestador)[:\s]+([A-ZÀ-Ú][^\n,]{3,40})/i.exec(body)
  if (nfe && /nota\s+fiscal|nfe|nf-e/i.test(text)) return `NF-e ${nfe[1].trim()}`

  // Transferência: "transferência para/de Fulano"
  const transf = /transfer[êe]ncia\s+(?:para|de|recebida\s+de)[:\s]+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){0,3})/i.exec(body)
  if (transf) return `Transferência ${transf[1].trim()}`

  // Assinatura/Mensalidade
  if (/assinatura|mensalidade|renovação|subscription/i.test(text)) {
    return `Assinatura ${senderName}`.substring(0, 80)
  }

  // Fallback: subject (cleaned up)
  const cleanSubject = subject
    .replace(/^(fwd?|re|enc):\s*/i, '')
    .replace(/\[.*?\]/g, '')
    .trim()

  return (cleanSubject || senderName || 'E-mail financeiro').substring(0, 80)
}

// ──────────────────────────────────────────────────────────────────────
// Detect installment patterns: "Parcela 3/12", "3 de 12", "03/12"
// ──────────────────────────────────────────────────────────────────────
function detectInstallment(text: string): { current: number; total: number } | undefined {
  const patterns = [
    /parcela\s+(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})/i,
    /(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})\s*parcela/i,
    /(\d{1,2})ª?\s*parcela\s+(?:de|\/)\s*(\d{1,2})/i,
  ]
  for (const re of patterns) {
    const m = re.exec(text)
    if (m) {
      const current = parseInt(m[1])
      const total = parseInt(m[2])
      if (current > 0 && total > 1 && current <= total && total <= 72) {
        return { current, total }
      }
    }
  }
  return undefined
}

// ──────────────────────────────────────────────────────────────────────
// Extract a relevant date from email body (due date, payment date, etc.)
// Falls back to null if nothing found — caller uses email header date.
// ──────────────────────────────────────────────────────────────────────
function extractRelevantDate(text: string): string | null {
  // Patterns ordered by relevance: due date > payment date > competence
  const patterns = [
    // "vencimento: 15/03/2026" or "vencimento em 15/03/2026"
    /vencimento[:\s]+(?:em\s+)?(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/i,
    // "data de pagamento: 15/03/2026"
    /data\s+(?:de\s+)?pagamento[:\s]+(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/i,
    // "pago em 15/03/2026"
    /pago\s+em[:\s]+(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/i,
    // "realizado em 15/03/2026" / "efetuado em 15/03/2026"
    /(?:realizado|efetuado|processado)\s+em[:\s]+(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/i,
    // "data: 15/03/2026" (generic but labeled)
    /\bdata[:\s]+(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/i,
    // "competência: 03/2026" (month/year only — use 1st of month)
    /compet[êe]ncia[:\s]+(\d{1,2})[\/\-.](\d{2,4})/i,
  ]

  for (const re of patterns) {
    const m = re.exec(text)
    if (!m) continue

    // Handle competência (MM/YYYY) — only 2 capture groups
    if (m.length === 3) {
      const month = parseInt(m[1])
      let year = parseInt(m[2])
      if (year < 100) year += 2000
      if (month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
        return new Date(year, month - 1, 1).toISOString()
      }
      continue
    }

    // DD/MM/YYYY
    const day = parseInt(m[1])
    const month = parseInt(m[2])
    let year = parseInt(m[3])
    if (year < 100) year += 2000

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
      const d = new Date(year, month - 1, day)
      if (!isNaN(d.getTime())) return d.toISOString()
    }
  }

  return null
}

// ──────────────────────────────────────────────────────────────────────
// Parse credit card statement — extract individual purchases
// Returns multiple transactions if line items found, otherwise null
// ──────────────────────────────────────────────────────────────────────
function parseCreditCardStatement(body: string, msgId: string, date: string, senderName: string, accountKey?: string): ParsedTransaction[] | null {
  const text = body.toLowerCase()

  // Only trigger for credit card statements
  if (!/fatura|extrato.*cart[ãa]o|cart[ãa]o.*cr[ée]dito/i.test(text)) return null

  // Look for line items: "DESCRICAO    R$ 123,45" or "DESCRICAO  123,45"
  // Common patterns in bank statement emails
  const lineItemPatterns = [
    // "ESTABELECIMENTO    R$ 123,45" or "ESTABELECIMENTO  123,45"
    /^[\s]*([A-ZÀ-Ú][A-ZÀ-Ú0-9\s\-\*\.\/]{3,40}?)\s{2,}R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})\s*$/gim,
    // "dd/mm  ESTABELECIMENTO  R$ 123,45"
    /^\s*\d{2}\/\d{2}\s+([A-ZÀ-Ú][A-ZÀ-Ú0-9\s\-\*\.\/]{3,40}?)\s{2,}R?\$?\s*([\d]{1,3}(?:\.\d{3})*,\d{2})\s*$/gim,
  ]

  const items: ParsedTransaction[] = []
  const seen = new Set<string>()
  let idx = 0

  for (const pattern of lineItemPatterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(body)) !== null) {
      const desc = match[1].trim().replace(/\s{2,}/g, ' ')
      const val = parseFloat(match[2].replace(/\./g, '').replace(',', '.'))

      // Skip headers, totals, and noise
      if (val < 1 || val > 500_000) continue
      if (/total|subtotal|pagamento|cr[ée]dito|saldo|limite|disponível|mínimo/i.test(desc)) continue
      if (desc.length < 3) continue

      // Skip duplicates across patterns
      const dedupeKey = `${desc.toLowerCase()}:${val}`
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)

      items.push({
        type: 'expense',
        amount: val,
        description: desc.substring(0, 80),
        category: detectCategory(desc),
        date,
        source: `Gmail: ${senderName} (fatura)`,
        source_id: `gmail:${accountKey ? accountKey + ':' : ''}${msgId}:item${idx++}`,
        confidence: 'medium',
      })
    }
  }

  // Only return if we found at least 2 items (otherwise it's not really a statement)
  return items.length >= 2 ? items : null
}

// ──────────────────────────────────────────────────────────────────────
// PDF attachment support
// Extracts text from PDF attachments (boletos, NF-e, receipts)
// Works for text-based PDFs; compressed/scanned PDFs fall back gracefully
// ──────────────────────────────────────────────────────────────────────
function findPDFParts(payload: any): any[] {
  if (!payload) return []
  const parts: any[] = []
  if (payload.mimeType === 'application/pdf' && payload.body?.attachmentId) {
    parts.push(payload)
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      parts.push(...findPDFParts(part))
    }
  }
  return parts
}

function decodePDFOctal(s: string): string {
  return s
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\').replace(/\\([()\s])/g, '$1')
}

function extractTextFromPDF(bytes: Uint8Array): string {
  const raw = new TextDecoder('latin1').decode(bytes)
  const texts: string[] = []

  // Extract text inside BT … ET blocks (standard PDF text operators)
  const btEt = /BT([\s\S]*?)ET/g
  let block: RegExpExecArray | null
  while ((block = btEt.exec(raw)) !== null) {
    const content = block[1]
    // (text) Tj
    const tj = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g
    let m: RegExpExecArray | null
    while ((m = tj.exec(content)) !== null) {
      const t = decodePDFOctal(m[1]).trim()
      if (t) texts.push(t)
    }
    // [(text) kern …] TJ
    const tjArr = /\[([\s\S]*?)\]\s*TJ/g
    while ((m = tjArr.exec(content)) !== null) {
      const strParts = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g
      let s: RegExpExecArray | null
      while ((s = strParts.exec(m[1])) !== null) {
        const t = decodePDFOctal(s[1]).trim()
        if (t) texts.push(t)
      }
    }
  }

  // Also scan raw bytes for financial patterns (catches some compressed PDFs)
  const financialRe = [
    /R\$\s*[\d.]+,\d{2}/g,
    /\d{2}\/\d{2}\/\d{4}/g,
    /vencimento[:\s]+\d{2}\/\d{2}\/\d{4}/gi,
    /valor[:\s]+R?\$?\s*[\d.]+,\d{2}/gi,
  ]
  for (const re of financialRe) {
    let m: RegExpExecArray | null
    while ((m = re.exec(raw)) !== null) texts.push(m[0])
  }

  return texts.join(' ').replace(/\s+/g, ' ').trim()
}

async function fetchPDFAttachment(msgId: string, attachmentId: string, token: string): Promise<Uint8Array | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}/attachments/${attachmentId}`,
      { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.data) return null
    const base64 = data.data.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

// ──────────────────────────────────────────────────────────────────────
// NF-e XML attachment support
// Structured data: always high confidence, extracts value + emitter
// ──────────────────────────────────────────────────────────────────────
function findXMLParts(payload: any): any[] {
  if (!payload) return []
  const parts: any[] = []
  const mime = payload.mimeType || ''
  const filename = (payload.filename || '').toLowerCase()
  if ((mime === 'application/xml' || mime === 'text/xml' ||
       (mime === 'application/octet-stream' && filename.endsWith('.xml')))
      && payload.body?.attachmentId) {
    parts.push(payload)
  }
  if (payload.parts) {
    for (const part of payload.parts) parts.push(...findXMLParts(part))
  }
  return parts
}

function parseNFeXML(xml: string): { amount: number; emitter: string; date: string | null } | null {
  if (!/nfeProc|infNFe|NFe\s+xmlns/i.test(xml)) return null
  const vNF = /<vNF>([\d.]+)<\/vNF>/i.exec(xml)
  const amount = vNF ? parseFloat(vNF[1]) : 0
  if (!amount || amount < 1) return null
  const xNome = /<emit>[\s\S]{0,300}?<xNome>([^<]+)<\/xNome>/i.exec(xml)
  const emitter = xNome ? xNome[1].trim() : ''
  const dhEmi = /<dhEmi>([^<]{10,25})<\/dhEmi>/i.exec(xml)
  let date: string | null = null
  if (dhEmi) {
    try {
      const d = new Date(dhEmi[1])
      if (!isNaN(d.getTime())) date = d.toISOString()
    } catch { /* keep null */ }
  }
  return { amount, emitter, date }
}

// ──────────────────────────────────────────────────────────────────────
// Parse single message → transaction(s)
// Returns array: usually 1 item, but credit card statements can be many
// ──────────────────────────────────────────────────────────────────────
async function parseMessage(msg: any, accessToken: string, accountKey?: string, userContext?: string): Promise<ParsedTransaction[]> {
  const idPrefix = accountKey ? `gmail:${accountKey}:` : 'gmail:'
  const headers: Array<{ name: string; value: string }> = msg.payload?.headers || []
  const subject = headers.find(h => h.name === 'Subject')?.value || ''
  const from = headers.find(h => h.name === 'From')?.value || ''
  const dateHeader = headers.find(h => h.name === 'Date')?.value || ''

  let body = extractText(msg.payload)

  // Filter out marketing/promotional/declined emails
  if (isPromotionalOrIrrelevant(msg, subject, body)) return []

  // NF-e XML attachments — structured data, highest confidence, return immediately
  try {
  const xmlParts = findXMLParts(msg.payload)
  if (xmlParts.length > 0) {
    for (const part of xmlParts.slice(0, 2)) {
      const attachmentId = part.body?.attachmentId
      if (!attachmentId) continue
      const xmlBytes = await fetchPDFAttachment(msg.id, attachmentId, accessToken)
      if (!xmlBytes) continue
      const xmlText = new TextDecoder('utf-8', { fatal: false }).decode(xmlBytes)
      const nfe = parseNFeXML(xmlText)
      if (nfe && nfe.amount >= 1) {
        const senderName = from.replace(/<.*>/, '').replace(/"/g, '').trim()
        let date = nfe.date
        if (!date) {
          try {
            const parsed = new Date(dateHeader)
            if (!isNaN(parsed.getTime())) date = parsed.toISOString()
          } catch { /* keep null */ }
          if (!date) date = new Date().toISOString()
        }
        return [{
          type: 'expense',
          amount: nfe.amount,
          description: nfe.emitter ? `NF-e ${nfe.emitter.substring(0, 60)}` : 'Nota Fiscal',
          category: detectCategory(nfe.emitter || subject),
          date,
          source: `Gmail: ${senderName || from} (NF-e)`,
          source_id: `${idPrefix}${msg.id}:nfe`,
          confidence: 'high' as const,
        }]
      }
    }
  }
  } catch (e) { console.error('NF-e XML processing error:', e) }

  // Augment body with PDF attachment text (boletos, NF-e, receipts)
  try {
  const pdfParts = findPDFParts(msg.payload)
  if (pdfParts.length > 0) {
    const part = pdfParts[0] // first PDF only per email
    const attachmentId = part.body?.attachmentId
    if (attachmentId) {
      const pdfBytes = await fetchPDFAttachment(msg.id, attachmentId, accessToken)
      if (pdfBytes) {
        const pdfText = extractTextFromPDF(pdfBytes)
        if (pdfText.length > 20) body = body + '\n' + pdfText
      }
    }
  }
  } catch (e) { console.error('PDF processing error:', e) }

  const combined = subject + '\n' + body
  const senderName = from.replace(/<.*>/, '').replace(/"/g, '').trim()

  // Prefer date from body over email send date
  let date = extractRelevantDate(combined)
  if (!date) {
    try {
      const parsed = new Date(dateHeader)
      if (!isNaN(parsed.getTime())) date = parsed.toISOString()
    } catch { /* keep default */ }
  }
  if (!date) date = new Date().toISOString()

  // Try to parse as credit card statement with individual items
  const statementItems = parseCreditCardStatement(body, msg.id, date, senderName, accountKey)
  if (statementItems) return statementItems

  // AI parser — handles all banks, filters spam, uses user context for personalization
  const aiResult = await parseWithAI(subject, body, senderName, userContext)
  if (aiResult !== null) {
    if (!aiResult.isTransaction) return []
    const installment = detectInstallment(combined)
    return [{
      type: aiResult.type,
      amount: aiResult.amount,
      description: aiResult.description,
      category: aiResult.category,
      date,
      source: `Gmail: ${senderName || from}`,
      source_id: `${idPrefix}${msg.id}`,
      confidence: aiResult.confidence,
      installment,
    }]
  }

  // Regex fallback if AI is unavailable
  const { value: amount, score } = extractBestAmount(combined)
  if (amount < 1) return []

  const description = extractRichDescription(subject, body, senderName)
  const confidence: 'high' | 'medium' | 'low' = score >= 8 ? 'high' : score >= 5 ? 'medium' : 'low'
  const installment = detectInstallment(combined)

  return [{
    type: detectType(subject, body),
    amount,
    description: installment ? `${description} (${installment.current}/${installment.total})` : description,
    category: detectCategory(combined),
    date,
    source: `Gmail: ${senderName || from}`,
    source_id: `${idPrefix}${msg.id}`,
    confidence,
    installment,
  }]
}

// ──────────────────────────────────────────────────────────────────────
// AI-powered parser using GPT-4o-mini
// Returns null if AI is unavailable (caller falls back to regex)
// Returns {isTransaction: false} if it's spam/marketing
// ──────────────────────────────────────────────────────────────────────
interface AIParseResult {
  isTransaction: boolean
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  confidence: 'high' | 'medium' | 'low'
}

async function parseWithAI(
  subject: string,
  body: string,
  senderName: string,
  userContext?: string
): Promise<AIParseResult | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return null

  const truncatedBody = body.slice(0, 3000)

  const prompt = `Você é um extrator de transações financeiras para um app de contabilidade de pequenas empresas brasileiras (MEI).

Analise o e-mail e determine se representa uma transação financeira CONFIRMADA.

Remetente: ${senderName}
Assunto: ${subject}
Corpo: ${truncatedBody}
${userContext ?? ''}

Retorne APENAS JSON no formato:
{
  "isTransaction": boolean,
  "type": "income" | "expense",
  "amount": number,
  "description": "string max 60 chars em pt-BR",
  "category": "Vendas" | "Fornecedores" | "Fixo" | "Variável" | "Receita" | "Salários" | "Aluguel" | "Serviços" | "Marketing" | "Impostos" | "Outros",
  "confidence": "high" | "medium" | "low"
}

Regras:
- isTransaction=true SOMENTE para: comprovante PIX enviado/recebido, TED confirmada, boleto pago, NF-e, assinatura cobrada, fatura paga, recibo de pagamento
- isTransaction=false para: ofertas de crédito, marketing, "regularize sua dívida", "pague agora" sem comprovante, promoções, alertas sem transação confirmada
- amount: número BRL sem símbolo (ex: 150.00)
- type=income: dinheiro ENTRANDO na conta (recebimentos, vendas, pix recebido)
- type=expense: dinheiro SAINDO (pagamentos, boletos, assinaturas, pix enviado)
- confidence=high: valor e tipo certos; medium: valor provável; low: ambíguo
- Use os padrões anteriores do usuário para melhorar categorização e descrição quando disponíveis`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0,
        max_tokens: 150,
      }),
      signal: AbortSignal.timeout(8000), // 8s timeout — don't block the scan
    })

    if (!res.ok) return null

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    const parsed: AIParseResult = JSON.parse(content)

    // Validate required fields
    if (typeof parsed.isTransaction !== 'boolean') return null
    if (parsed.isTransaction && (typeof parsed.amount !== 'number' || parsed.amount <= 0)) return null

    return parsed
  } catch {
    return null // Timeout, network error, invalid JSON — fall back to regex
  }
}

// ──────────────────────────────────────────────────────────────────────
// Scan a single Gmail inbox using a fresh access token
// Returns parsed transactions + total messages scanned
// ──────────────────────────────────────────────────────────────────────
async function scanInbox(
  accessToken: string,
  days: number,
  accountKey?: string,
  userContext?: string
): Promise<{ transactions: ParsedTransaction[]; scanned: number }> {
  const afterEpoch = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60
  const dateFilter = `after:${afterEpoch}`
  const bankQuery = `(${BANK_QUERY}) ${dateFilter}`
  const keywordQuery = `(${KEYWORD_QUERY}) ${dateFilter} -category:promotions -category:social`

  const [bankIds, keywordIds] = await Promise.all([
    listAllMessages(accessToken, bankQuery, 300),
    listAllMessages(accessToken, keywordQuery, 300),
  ])

  const ids = Array.from(new Set([...bankIds, ...keywordIds]))
  console.log(`[scanInbox${accountKey ? ` ${accountKey}` : ''}] banks:${bankIds.length} keywords:${keywordIds.length} unique:${ids.length}`)

  const messages = await fetchMessages(ids, accessToken)
  const raw: ParsedTransaction[] = []

  // Process in parallel batches of 15 — bank parsers are instant, AI calls ~1s each
  for (let i = 0; i < messages.length; i += 15) {
    const batch = messages.slice(i, i + 15)
    const results = await Promise.all(batch.map(msg => parseMessage(msg, accessToken, accountKey, userContext)))
    for (const r of results) raw.push(...r)
  }

  // Per-account dedup (cross-account dedup happens in the caller)
  const seen = new Set<string>()
  const unique = raw.filter(t => {
    if (seen.has(t.source_id)) return false
    seen.add(t.source_id)
    return true
  })

  return { transactions: unique, scanned: messages.length }
}

// ──────────────────────────────────────────────────────────────────────
// FIX 4: Fetch all pages (up to 200 messages) via nextPageToken
// ──────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────
// Recurrence detection — marks transactions that repeat across ≥3 months
// Groups by rounded amount + first word of description
// ──────────────────────────────────────────────────────────────────────
function detectRecurring(transactions: ParsedTransaction[]): ParsedTransaction[] {
  if (transactions.length < 3) return transactions

  const groups = new Map<string, ParsedTransaction[]>()
  for (const t of transactions) {
    // Normalize description: strip installment "(3/12)", lowercase, first word
    const firstWord = t.description
      .replace(/\(.*?\)/g, '')
      .trim()
      .split(/\s+/)[0]
      .toLowerCase()
    const key = `${Math.round(t.amount)}:${firstWord}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }

  const recurringIds = new Set<string>()
  for (const [, txs] of groups) {
    if (txs.length < 3) continue
    const months = new Set(txs.map(t => {
      const d = new Date(t.date)
      return `${d.getFullYear()}-${d.getMonth()}`
    }))
    if (months.size >= 3) {
      txs.forEach(t => recurringIds.add(t.source_id))
    }
  }

  if (recurringIds.size === 0) return transactions
  return transactions.map(t =>
    recurringIds.has(t.source_id)
      ? { ...t, isRecurring: true, category: t.category === 'Outros' ? 'Fixo' : t.category }
      : t
  )
}

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

// Fetch messages in parallel batches with timeout protection
// Stops fetching if we're approaching the Edge Function time limit
async function fetchMessages(ids: string[], token: string, batchSize = 10, timeLimitMs = 45000): Promise<any[]> {
  const results: any[] = []
  const startTime = Date.now()

  for (let i = 0; i < ids.length; i += batchSize) {
    // Stop if we're running out of time (keep 10s buffer for parsing + response)
    if (Date.now() - startTime > timeLimitMs) {
      console.log(`[parse-gmail] Time limit reached after ${results.length}/${ids.length} messages`)
      break
    }

    const batch = ids.slice(i, i + batchSize)
    const fetched = await Promise.all(
      batch.map(async (id) => {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 8000)
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
            { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
          )
          clearTimeout(timeout)
          return res.ok ? res.json() : null
        } catch {
          return null
        }
      })
    )
    results.push(...fetched.filter(Boolean))
  }
  return results
}

// ──────────────────────────────────────────────────────────────────────
// Main handler
// Two modes:
//   1. Legacy (single account): caller passes provider_token / provider_refresh_token
//   2. Multi-account: caller passes only `days` + Authorization header (user JWT).
//      Edge Function reads gmail_accounts table and scans each one.
// ──────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json()
    const { provider_token, provider_refresh_token, days = 90 } = body

    // ────────────── Legacy single-account mode ──────────────
    if (provider_token || provider_refresh_token) {
      let accessToken: string = provider_token
      let tokenRefreshed = false

      if (!accessToken && provider_refresh_token) {
        const refreshed = await refreshGoogleToken(provider_refresh_token)
        if (!refreshed) return jsonError('Sessão do Gmail expirada. Reconecte sua conta Google.', 401)
        accessToken = refreshed
        tokenRefreshed = true
      }

      const { transactions: raw, scanned } = await scanInbox(accessToken, days)
      const transactions = detectRecurring(raw)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return new Response(
        JSON.stringify({
          transactions,
          scanned,
          found: transactions.length,
          token_refreshed: tokenRefreshed,
          new_access_token: tokenRefreshed ? accessToken : undefined,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ────────────── Multi-account mode ──────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonError('Authorization header required', 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return jsonError('Sessão inválida', 401)

    const adminClient = createClient(supabaseUrl, serviceKey)

    let accounts = (await adminClient
      .from('gmail_accounts')
      .select('id, email, refresh_token')
      .eq('user_id', user.id)).data as Array<{ id: string; email: string; refresh_token: string }> | null

    // Auto-migration: if no accounts but user has the legacy token in profiles,
    // discover the email via Gmail API and migrate it into gmail_accounts.
    if (!accounts || accounts.length === 0) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('gmail_refresh_token')
        .eq('id', user.id)
        .single()
      const legacyToken = (profile as any)?.gmail_refresh_token
      if (legacyToken) {
        const accessToken = await refreshGoogleToken(legacyToken)
        if (accessToken) {
          const profileRes = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/profile',
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
          if (profileRes.ok) {
            const gp = await profileRes.json()
            const email = gp.emailAddress
            if (email) {
              await adminClient.from('gmail_accounts').upsert(
                { user_id: user.id, email, refresh_token: legacyToken },
                { onConflict: 'user_id,email' }
              )
              accounts = [{
                id: '', // re-read below
                email,
                refresh_token: legacyToken,
              }]
              const fresh = await adminClient
                .from('gmail_accounts')
                .select('id, email, refresh_token')
                .eq('user_id', user.id)
              accounts = fresh.data as any
            }
          }
        }
      }
    }

    if (!accounts || accounts.length === 0) {
      return jsonError('Nenhuma conta Gmail conectada. Adicione uma conta primeiro.', 400)
    }

    // Build personalized context from user's past transactions (fetched once for all accounts)
    let userContext: string | undefined
    try {
      const { data: patterns } = await adminClient
        .from('transactions')
        .select('description, category, type')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
        .not('source_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200)

      if (patterns && patterns.length > 0) {
        // Aggregate by description+category+type
        const freq = new Map<string, UserPattern>()
        for (const p of patterns as any[]) {
          const key = `${p.description?.toLowerCase()}|${p.category}|${p.type}`
          if (freq.has(key)) {
            freq.get(key)!.freq++
          } else {
            freq.set(key, { description: p.description ?? '', category: p.category ?? 'Outros', type: p.type, freq: 1 })
          }
        }
        const sorted = Array.from(freq.values()).sort((a, b) => b.freq - a.freq)

        const incomes = patterns.filter((p: any) => p.type === 'income')
        const expenses = patterns.filter((p: any) => p.type === 'expense')
        const avgIncome = incomes.length ? 0 : 0 // aggregate query not needed — context already helps
        const avgExpense = 0

        userContext = buildUserContext(sorted, avgIncome, avgExpense)
      }
    } catch { /* context is optional — scan proceeds without it */ }

    const allTransactions: ParsedTransaction[] = []
    let totalScanned = 0
    const accountResults: Array<{ email: string; scanned: number; found: number; error?: string }> = []

    for (const account of accounts) {
      try {
        const accessToken = await refreshGoogleToken(account.refresh_token)
        if (!accessToken) {
          accountResults.push({ email: account.email, scanned: 0, found: 0, error: 'Token inválido — reconecte essa conta' })
          continue
        }
        const { transactions: tx, scanned } = await scanInbox(accessToken, days, account.email, userContext)
        allTransactions.push(...tx)
        totalScanned += scanned
        accountResults.push({ email: account.email, scanned, found: tx.length })
        await adminClient
          .from('gmail_accounts')
          .update({ last_scan_at: new Date().toISOString() })
          .eq('id', account.id)
      } catch (err: any) {
        accountResults.push({ email: account.email, scanned: 0, found: 0, error: err.message })
      }
    }

    // Recurrence detection across all accounts
    const finalTransactions = detectRecurring(allTransactions)
    finalTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return new Response(
      JSON.stringify({
        transactions: finalTransactions,
        scanned: totalScanned,
        found: finalTransactions.length,
        accounts: accountResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return jsonError(error.message ?? 'Unknown error', 500)
  }
})

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
