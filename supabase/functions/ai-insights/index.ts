// Edge Function: AI Insights API
// Centralized OpenAI API calls from frontend (secure backend)
// Uses OPENAI_API_KEY from Supabase secrets

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OpenAI API configuration
const OPENAI_API_BASE = 'https://api.openai.com/v1'
const OPENAI_MODEL = 'gpt-4o-mini' // Optimized for speed/latency

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get OpenAI API key from secrets
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured in secrets')
    }

    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client with the service role key to verify the JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify JWT token by getting user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { action, userId, daysAhead, ...params } = await req.json()

    // Validate userId matches authenticated user
    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Route to appropriate handler
    let result
    switch (action) {
      case 'generate-insights':
        result = await generateInsights(supabase, userId, openaiKey)
        break
      case 'predict-balance':
        result = await predictBalance(supabase, userId, openaiKey, daysAhead || 30)
        break
      case 'detect-anomalies':
        result = await detectAnomalies(supabase, userId, openaiKey)
        break
      case 'analyze-patterns':
        result = await analyzeSpendingPatterns(supabase, userId, openaiKey)
        break
      case 'generate-action-plan':
        result = await generateActionPlan(
          supabase,
          userId,
          openaiKey,
          params.daysUntilZero,
          params.currentBalance,
          params.monthlyBurn
        )
        break
      case 'chat':
        result = await chatWithFinancialContext(
          supabase,
          userId,
          openaiKey,
          params.messages
        )
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('AI Insights error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Helper: Get user financial data
async function getUserFinancialData(supabase: any, userId: string) {
  const now = new Date()
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Get ALL transactions for true balance calculation
  const { data: allTransactions, error: allError } = await supabase
    .from('transactions')
    .select('id, type, amount, date, description, category')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1000)

  if (allError) throw allError

  const all = (allTransactions || []).map((t: any) => ({ ...t, amount: Number(t.amount) }))

  // All-time balance (consistent with dashboard)
  const allTimeIncome = all.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
  const allTimeExpenses = all.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
  const currentBalance = allTimeIncome - allTimeExpenses

  // Recent 90-day window for trend analysis
  const recentTransactions = all.filter((t: any) => {
    if (!t.date) return false
    return new Date(t.date) >= threeMonthsAgo
  })

  const income = recentTransactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
  const expenses = recentTransactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)

  // Calculate actual months with data (not assume 3)
  const monthsWithData = new Set(
    recentTransactions.map((t: any) => t.date?.substring(0, 7)).filter(Boolean)
  )
  const numMonths = Math.max(monthsWithData.size, 1)

  return {
    transactions: recentTransactions,
    currentBalance,
    income,
    expenses,
    numMonths,
    allTimeIncome,
    allTimeExpenses,
    period: {
      start: threeMonthsAgo.toISOString(),
      end: now.toISOString(),
      days: 90,
    },
  }
}

// Helper: Call OpenAI API
async function callOpenAI(apiKey: string, messages: any[], options: any = {}) {
  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      response_format: { type: 'json_object' },
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1500,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  if (!content) {
    throw new Error('Empty response from OpenAI')
  }

  return JSON.parse(content)
}

// Helper: Clean transaction description (filter email parsing garbage)
function cleanDescription(desc: string): string {
  if (!desc) return 'Sem descrição'
  // Remove common email spam patterns
  const cleaned = desc.trim()
  if (cleaned.length < 3) return 'Sem descrição'
  return cleaned.substring(0, 40)
}

// Helper: Filter valid transactions (exclude obvious parsing garbage)
function filterValidTransactions(transactions: any[]): any[] {
  return transactions.filter((t: any) => {
    // Exclude transactions with absurdly high amounts (likely parse errors)
    if (t.amount > 500000) return false
    // Exclude expense transactions categorized as 'Vendas' (classification error)
    if (t.type === 'expense' && t.category === 'Vendas') return false
    return true
  })
}

// Helper: Preprocess financial data
function preprocessFinancialData(data: any) {
  const validTransactions = filterValidTransactions(data.transactions)
  const expenses = validTransactions.filter((t: any) => t.type === 'expense')

  // Top 5 categories
  const byCategory: Record<string, number> = {}
  expenses.forEach((t: any) => {
    const cat = t.category || 'Outros'
    byCategory[cat] = (byCategory[cat] || 0) + t.amount
  })
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, total]) => `${cat} R$ ${total.toFixed(0)}`)
    .join(', ')

  // Recent high-value transactions (with clean descriptions)
  const recentHighValue = validTransactions
    .slice(0, 15)
    .filter((t: any) => t.amount > 100)
    .map((t: any) => `${cleanDescription(t.description)} R$ ${t.amount.toFixed(0)} (${t.type === 'income' ? 'receita' : 'despesa'})`)
    .join(', ')

  // Category breakdown with monthly average
  const numMonths = data.numMonths || 1
  const categoryBreakdown = Object.entries(byCategory)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 8)
    .map(([cat, total]) => `${cat}: R$ ${(total as number).toFixed(0)} total (R$ ${((total as number) / numMonths).toFixed(0)}/mês)`)
    .join(' | ')

  // Top expenses (with clean descriptions)
  const topExpenses = expenses
    .sort((a: any, b: any) => b.amount - a.amount)
    .slice(0, 10)
    .map((t: any) => `${cleanDescription(t.description)} R$ ${t.amount.toFixed(0)}`)
    .join(', ')

  return { topCategories, recentHighValue, categoryBreakdown, topExpenses, numMonths }
}

// Action: Generate Insights
async function generateInsights(supabase: any, userId: string, openaiKey: string) {
  const financialData = await getUserFinancialData(supabase, userId)
  const summary = preprocessFinancialData(financialData)
  const monthlyExpense = financialData.expenses / summary.numMonths
  const monthlyIncome = financialData.income / summary.numMonths

  const prompt = `SALDO TOTAL: R$ ${financialData.currentBalance.toFixed(0)} (all-time: receita R$ ${financialData.allTimeIncome.toFixed(0)} - despesa R$ ${financialData.allTimeExpenses.toFixed(0)})
Últimos ${summary.numMonths} meses: Receita R$ ${monthlyIncome.toFixed(0)}/mês | Despesa R$ ${monthlyExpense.toFixed(0)}/mês | ${financialData.transactions.length} transações

Top categorias despesa: ${summary.topCategories}

Gere 3-5 insights JSON:
{
  "insights": [{
    "title": "< 60 chars",
    "description": "Detalhes com números reais do usuário",
    "category": "spending|income|balance|savings|risk|opportunity",
    "severity": "high|medium|low",
    "action_items": ["ação específica e executável"],
    "confidence": 85
  }]
}

IMPORTANTE: Use o SALDO TOTAL (all-time) como referência principal. ${financialData.currentBalance < 0 ? 'O saldo é NEGATIVO — priorize alertas de risco e ações de recuperação.' : ''} Foco: alertas urgentes, onde cortar, como aumentar receita. Ações executáveis hoje.`

  const result = await callOpenAI(
    openaiKey,
    [
      {
        role: 'system',
        content:
          'CFO virtual do Vault para MEIs e pequenos negócios brasileiros. Insights diretos com números reais, ações executáveis hoje. Zero teoria, zero porcentagens absurdas.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, max_tokens: 1500 }
  )

  return result.insights || []
}

// Action: Predict Balance
async function predictBalance(supabase: any, userId: string, openaiKey: string, daysAhead: number) {
  const financialData = await getUserFinancialData(supabase, userId)
  const summary = preprocessFinancialData(financialData)
  const numMonths = summary.numMonths
  const monthlyIncome = financialData.income / numMonths
  const monthlyExpense = financialData.expenses / numMonths
  const dailyNet = (monthlyIncome - monthlyExpense) / 30

  const prompt = `SALDO ATUAL (all-time): R$ ${financialData.currentBalance.toFixed(0)}
Média mensal (${numMonths} meses): Receita R$ ${monthlyIncome.toFixed(0)} | Despesa R$ ${monthlyExpense.toFixed(0)} | Líquido R$ ${(monthlyIncome - monthlyExpense).toFixed(0)}/mês (R$ ${dailyNet.toFixed(0)}/dia)

Categorias: ${summary.categoryBreakdown}

Preveja saldo em ${daysAhead} dias. JSON:
{
  "predicted_balance": ${(financialData.currentBalance + dailyNet * daysAhead).toFixed(0)},
  "confidence": 0.75,
  "days_ahead": ${daysAhead},
  "trend": "texto curto descrevendo tendência",
  "factors": ["3-5 fatores que influenciam a previsão"]
}

IMPORTANTE: A previsão DEVE partir do saldo atual R$ ${financialData.currentBalance.toFixed(0)} e aplicar a tendência mensal. Não invente despesas que não existem nos dados. Confiança menor se poucos dados.`

  const result = await callOpenAI(
    openaiKey,
    [
      {
        role: 'system',
        content: 'Especialista modelagem financeira para MEIs brasileiros. Previsões conservadoras baseadas em dados reais. Nunca extrapole além do que os dados mostram.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.3, max_tokens: 800 }
  )

  return result
}

// Action: Detect Anomalies
async function detectAnomalies(supabase: any, userId: string, openaiKey: string) {
  const financialData = await getUserFinancialData(supabase, userId)
  const summary = preprocessFinancialData(financialData)

  const expenses = financialData.transactions.filter((t: any) => t.type === 'expense')
  const incomes = financialData.transactions.filter((t: any) => t.type === 'income')

  const avgExpense = expenses.length > 0 ? financialData.expenses / expenses.length : 0
  const avgIncome  = incomes.length  > 0 ? financialData.income  / incomes.length  : 0

  const prompt = `${financialData.transactions.length} transações | Despesa média: R$ ${avgExpense.toFixed(0)} | Receita média: R$ ${avgIncome.toFixed(0)}

Top 15 recentes: ${summary.recentHighValue}

Detecte anomalias JSON:
{"anomalies": [{"transaction_description": "nome", "amount": 2500, "date": "2025-01-10", "reason": "motivo", "severity": "high|medium|low"}]}

Buscar: valor >200% média, duplicatas, padrões estranhos. Vazio se ok.`

  const result = await callOpenAI(
    openaiKey,
    [
      {
        role: 'system',
        content: 'Detector de fraudes/anomalias. Identifique: transações suspeitas, duplicatas, valores 200%+ acima da média.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.2, max_tokens: 1000 }
  )

  return result.anomalies || []
}

// Action: Analyze Spending Patterns
async function analyzeSpendingPatterns(supabase: any, userId: string, openaiKey: string) {
  const financialData = await getUserFinancialData(supabase, userId)
  const summary = preprocessFinancialData(financialData)
  const numMonths = summary.numMonths
  const monthlyIncome = financialData.income / numMonths
  const monthlyExpense = financialData.expenses / numMonths

  const prompt = `Período: ${numMonths} meses de dados
Receita mensal média: R$ ${monthlyIncome.toFixed(0)} | Despesa mensal média: R$ ${monthlyExpense.toFixed(0)}

Breakdown por categoria (total e média/mês):
${summary.categoryBreakdown}

Analise JSON:
{"patterns": [{"category": "nome", "average_amount": 1250, "trend": "increasing|decreasing|stable", "insights": "análise prática com valor absoluto e recomendação acionável"}]}

REGRAS:
- Use average_amount como a MÉDIA MENSAL (total / ${numMonths} meses)
- Compare categorias entre si, NÃO use % absurdas (ex: "3000% da receita")
- Se receita é baixa, foque em "quanto cada categoria custa por mês" e "o que pode ser cortado"
- 3-5 categorias principais com números reais`

  const result = await callOpenAI(
    openaiKey,
    [
      {
        role: 'system',
        content: 'Analista financeiro para MEIs brasileiros. Análise prática: valores absolutos, comparações úteis, recomendações de corte. Evite porcentagens distorcidas quando receita é muito baixa.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.4, max_tokens: 1200 }
  )

  return result.patterns || []
}

// Action: Generate Action Plan
async function generateActionPlan(
  supabase: any,
  userId: string,
  openaiKey: string,
  daysUntilZero: number,
  currentBalance: number,
  monthlyBurn: number
) {
  const financialData = await getUserFinancialData(supabase, userId)
  const summary = preprocessFinancialData(financialData)

  const prompt = `🚨 CRÍTICO: Saldo R$ ${currentBalance.toFixed(0)} zera em ${daysUntilZero}d | Queima R$ ${monthlyBurn.toFixed(0)}/mês

${summary.topExpenses}

Gere 4-6 ações JSON:
{
  "actions": [{
    "id": "1",
    "title": "< 60 chars",
    "description": "Específico: quem, quanto, quando, como (80+ chars)",
    "impact": "+X dias ou -R$ Y/mês",
    "priority": "high|medium|low",
    "category": "revenue|expense|negotiation|financing",
    "completed": false
  }]
}

Exemplos BOM:
• "Antecipar Cliente Alfa R$ 3.5k com 3% desc (ref: #1234) - ligar 14h hoje" → "+12d"
• "Cancelar Netflix/Spotify R$ 150/mês - app agora" → "-R$ 150"

Exemplos RUIM:
• "Reduzir despesas" (vago)
• "Aumentar vendas" (genérico)

Ações HOJE, números reais, baseado em dados.`

  const result = await callOpenAI(
    openaiKey,
    [
      {
        role: 'system',
        content: 'Gerente de crise financeira. Foco: aumentar runway, cortar custos imediatos, antecipar receita. Ações cirúrgicas e específicas.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.5, max_tokens: 1000 }
  )

  return result.actions || []
}

// Action: Chat with Financial Context
async function chatWithFinancialContext(
  supabase: any,
  userId: string,
  openaiKey: string,
  messages: any[]
) {
  // 1. Get Financial Context
  const financialData = await getUserFinancialData(supabase, userId)
  const summary = preprocessFinancialData(financialData)

  const numMonths = summary.numMonths || 1
  const contextPrompt = `
CONTEXTO FINANCEIRO DO USUÁRIO (Use para responder):
- Saldo Atual (all-time): R$ ${financialData.currentBalance.toFixed(2)}
- Receita média mensal: R$ ${(financialData.income / numMonths).toFixed(2)}/mês (últimos ${numMonths} meses)
- Despesa média mensal: R$ ${(financialData.expenses / numMonths).toFixed(2)}/mês
- Top Categorias de Gastos: ${summary.topCategories}
- Transações Recentes Altas: ${summary.recentHighValue}
- Padrão de Gastos: ${summary.categoryBreakdown}

DIRETRIZES:
- Você é o Vault AI, um consultor financeiro pessoal, empático e prático.
- Use os dados acima para dar respostas específicas e personalizadas.
- Se o usuário perguntar "como estou?", analise o saldo e fluxo de caixa.
- Se perguntar "onde posso economizar?", olhe as categorias mais altas.
- Seja conciso (max 3 parágrafos). Use markdown para listas ou negrito.
- Nunca invente dados. Se não souber, diga que não tem essa informação nos últimos 90 dias.

FORMATO DE RESPOSTA (IMPORTANTE):
Você pode responder com texto normal, mas SE o usuário pedir uma simulação ou quiser adicionar uma transação, você DEVE incluir um bloco JSON no final da sua resposta (use markdown \\\`\\\`\\\`json ... \\\`\\\`\\\`).

1. INTENÇÃO: SIMULAÇÃO
Gatilhos: "E se a receita cair 20%?", "Simule aumento de gastos", "Qual impacto de perder 5k?"
JSON Schema:
\\\`\\\`\\\`json
{
  "type": "SIMULATION",
  "data": {
    "revenueChange": 0, // % (ex: -20 para queda de 20%)
    "expenseChange": 0, // % (ex: 10 para aumento de 10%)
    "oneTimeExpense": 0, // Valor absoluto (ex: 5000)
    "oneTimeRevenue": 0, // Valor absoluto
    "description": "Cenário de Queda de 20% na Receita"
  }
}
\`\`\`

2. INTENÇÃO: ADICIONAR TRANSAÇÃO (Zero Data Entry)
Gatilhos: "Gastei 50 no Uber", "Recebi 5000 do cliente X", "Paguei 100 de internet"
JSON Schema:
\`\`\`json
{
  "type": "ADD_TRANSACTION",
  "data": {
    "amount": 0, // Valor positivo
    "type": "expense", // ou "income"
    "category": "Outros", // IMPORTANTE: Use APENAS uma destas: 'Vendas', 'Fornecedores', 'Fixo', 'Variável', 'Receita', 'Salários', 'Aluguel', 'Serviços', 'Marketing', 'Impostos', 'Outros'. Para comida/transporte use 'Variável'.
    "description": "Descrição curta e clara",
    "date": "YYYY-MM-DD" // Data de hoje se não especificado
  }
}
\`\`\`

Se não for nenhum desses casos, responda apenas com texto.
`

  // 2. Prepare messages for OpenAI
  // Insert the system prompt with context at the beginning
  const apiMessages = [
    {
      role: 'system',
      content: contextPrompt
    },
    ...messages // Appends user's conversation history
  ]

  // 3. Call OpenAI
  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 350, // Shorter responses for faster chat
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return {
    role: 'assistant',
    content: data.choices[0].message.content
  }
}

