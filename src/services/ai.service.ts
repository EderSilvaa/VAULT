// AI Service - GPT-4o Integration for Predictive Financial Analysis
// Uses secure Edge Functions instead of direct OpenAI API calls
import { supabase } from '@/lib/supabase'

// Types
export interface AIInsight {
  id?: string
  title: string
  description: string
  category: 'spending' | 'income' | 'balance' | 'savings' | 'risk' | 'opportunity'
  severity: 'high' | 'medium' | 'low'
  action_items?: string[]
  confidence?: number
}

export interface BalancePrediction {
  predicted_balance: number
  confidence: number
  days_ahead: number
  trend: string
  factors?: string[]
}

export interface SpendingPattern {
  category: string
  average_amount: number
  trend: 'increasing' | 'decreasing' | 'stable'
  insights?: string
}

export interface AnomalyDetection {
  transaction_description: string
  amount?: number
  date: string
  reason: string
  severity: 'high' | 'medium' | 'low'
}

export const aiService = {
  /**
   * Check if AI service is configured and ready
   */
  isConfigured(): boolean {
    return true // Edge Functions handle API key validation
  },

  /**
   * Generate comprehensive financial insights for a user
   */
  async generateInsights(userId: string): Promise<AIInsight[]> {
    try {
      console.log('[AI] Generating insights for user:', userId)

      // Note: supabase.functions.invoke() automatically sends auth token if session exists
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          action: 'generate-insights',
          userId,
        },
      })

      console.log('[AI] Response:', { data, error })

      if (error) {
        console.error('[AI] Edge Function error details:', error)
        throw new Error(error.message || 'Edge Function error')
      }

      console.log('[AI] Generated', data?.length || 0, 'insights')
      return data || []
    } catch (error: any) {
      console.error('[AI] Error generating insights:', error)

      // Return fallback insights on error
      if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
        console.warn('[AI] Using fallback insights due to timeout/connection error')
        return this.getFallbackInsights()
      }

      throw new Error(`Failed to generate insights: ${error.message}`)
    }
  },

  /**
   * Predict future balance using AI
   */
  async predictBalance(userId: string, daysAhead: number = 30): Promise<BalancePrediction> {
    try {
      console.log(`[AI] Predicting balance for ${daysAhead} days ahead`)

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          action: 'predict-balance',
          userId,
          daysAhead,
        },
      })

      if (error) {
        throw new Error(error.message || 'Edge Function error')
      }

      console.log('[AI] Balance prediction:', data)
      return data
    } catch (error: any) {
      console.error('[AI] Error predicting balance:', error)
      throw new Error(`Failed to predict balance: ${error.message}`)
    }
  },

  /**
   * Detect spending anomalies
   */
  async detectAnomalies(userId: string): Promise<AnomalyDetection[]> {
    try {
      console.log('[AI] Detecting anomalies')

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          action: 'detect-anomalies',
          userId,
        },
      })

      if (error) {
        throw new Error(error.message || 'Edge Function error')
      }

      console.log('[AI] Detected', data?.length || 0, 'anomalies')
      return data || []
    } catch (error: any) {
      console.error('[AI] Error detecting anomalies:', error)
      throw new Error(`Failed to detect anomalies: ${error.message}`)
    }
  },

  /**
   * Analyze spending patterns by category
   */
  async analyzeSpendingPatterns(userId: string): Promise<SpendingPattern[]> {
    try {
      console.log('[AI] Analyzing spending patterns')

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          action: 'analyze-patterns',
          userId,
        },
      })

      if (error) {
        throw new Error(error.message || 'Edge Function error')
      }

      console.log('[AI] Analyzed', data?.length || 0, 'spending patterns')
      return data || []
    } catch (error: any) {
      console.error('[AI] Error analyzing patterns:', error)
      throw new Error(`Failed to analyze spending patterns: ${error.message}`)
    }
  },

  /**
   * Get user's financial data from Supabase
   */
  async getUserFinancialData(userId: string) {
    const now = new Date()
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Get transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions' as any)
      .select('*')
      .eq('user_id', userId)
      .gte('date', threeMonthsAgo.toISOString())
      .order('date', { ascending: false }) as { data: any[] | null, error: any }

    if (txError) throw txError

    // Get current balance
    const income = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
    const expenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0
    const currentBalance = income - expenses

    return {
      transactions: transactions || [],
      currentBalance,
      income,
      expenses,
      period: {
        start: threeMonthsAgo.toISOString(),
        end: now.toISOString(),
        days: 90
      }
    }
  },

  /**
   * Create prompt for generating insights (OPTIMIZED: -65% tokens)
   */
  createInsightsPrompt(data: any): string {
    const summary = this.preprocessFinancialData(data)

    return `Dados 90d: Saldo R$ ${data.currentBalance.toFixed(0)} | Receita R$ ${data.income.toFixed(0)} | Despesa R$ ${data.expenses.toFixed(0)} | ${data.transactions.length} transações

Top categorias: ${summary.topCategories}

Gere 3-5 insights JSON:
{
  "insights": [{
    "title": "< 60 chars",
    "description": "Detalhes com números",
    "category": "spending|income|balance|savings|risk|opportunity",
    "severity": "high|medium|low",
    "action_items": ["ação específica"],
    "confidence": 85
  }]
}

Foco: alertas urgentes, economia, padrões ruins, ações acionáveis.`
  },

  /**
   * Create prompt for balance prediction (OPTIMIZED: -70% tokens)
   */
  createBalancePredictionPrompt(data: any, daysAhead: number): string {
    const dailyAvg = {
      income: (data.income / 90).toFixed(0),
      expense: (data.expenses / 90).toFixed(0),
      net: ((data.income - data.expenses) / 90).toFixed(0)
    }

    return `Saldo: R$ ${data.currentBalance.toFixed(0)} | Média diária: +R$ ${dailyAvg.income} -R$ ${dailyAvg.expense} = ${dailyAvg.net}/dia

Preveja ${daysAhead}d JSON:
{
  "predicted_balance": 15420.50,
  "confidence": 0.85,
  "days_ahead": ${daysAhead},
  "trend": "texto curto",
  "factors": ["3-5 fatores"]
}

Use tendência, médias, sazonalidade.`
  },

  /**
   * Create prompt for anomaly detection (OPTIMIZED: -68% tokens)
   */
  createAnomalyDetectionPrompt(data: any): string {
    const expenses = data.transactions.filter((t: any) => t.type === 'expense')
    const incomes = data.transactions.filter((t: any) => t.type === 'income')
    const summary = this.preprocessFinancialData(data)

    return `${data.transactions.length} transações | Despesa média: R$ ${(data.expenses / expenses.length).toFixed(0)} | Receita média: R$ ${(data.income / incomes.length).toFixed(0)}

Top 15 recentes: ${summary.recentHighValue}

Detecte anomalias JSON:
{"anomalies": [{"transaction_description": "nome", "amount": 2500, "date": "2025-01-10", "reason": "motivo", "severity": "high|medium|low"}]}

Buscar: valor >200% média, duplicatas, padrões estranhos. Vazio se ok.`
  },

  /**
   * Create prompt for spending patterns analysis (OPTIMIZED: -72% tokens)
   */
  createSpendingPatternsPrompt(data: any): string {
    const summary = this.preprocessFinancialData(data)

    return `Receita mensal: R$ ${(data.income / 3).toFixed(0)}

${summary.categoryBreakdown}

Analise JSON:
{"patterns": [{"category": "nome", "average_amount": 1250, "trend": "increasing|decreasing|stable", "insights": "análise com % e recomendação"}]}

3-5 categorias principais, números específicos.`
  },

  /**
   * Preprocess financial data to reduce prompt tokens (NEW)
   */
  preprocessFinancialData(data: any): any {
    const expenses = data.transactions.filter((t: any) => t.type === 'expense')
    const incomes = data.transactions.filter((t: any) => t.type === 'income')

    // Top 5 categories by total
    const byCategory: Record<string, number> = {}
    expenses.forEach((t: any) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
    })
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, total]) => `${cat} R$ ${total.toFixed(0)}`)
      .join(', ')

    // Top 10 recent high-value transactions
    const recentHighValue = data.transactions
      .slice(0, 15)
      .filter((t: any) => t.amount > 100)
      .map((t: any) => `${t.description.substring(0, 20)} R$ ${t.amount.toFixed(0)}`)
      .join(', ')

    // Category breakdown for patterns
    const categoryBreakdown = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat, total]) => `${cat}: R$ ${total.toFixed(0)}`)
      .join(' | ')

    // Top expenses for action plan
    const topExpenses = expenses
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 10)
      .map((t: any) => `${t.description.substring(0, 25)} R$ ${t.amount.toFixed(0)}`)
      .join(', ')

    return {
      topCategories,
      recentHighValue,
      categoryBreakdown,
      topExpenses
    }
  },

  /**
   * Summarize transactions by category (LEGACY - kept for compatibility)
   */
  summarizeByCategory(transactions: any[]): string {
    const byCategory: Record<string, { total: number; count: number }> = {}

    transactions.forEach(t => {
      if (t.type === 'expense') {
        if (!byCategory[t.category]) {
          byCategory[t.category] = { total: 0, count: 0 }
        }
        byCategory[t.category].total += Number(t.amount)
        byCategory[t.category].count++
      }
    })

    return Object.entries(byCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([cat, data]) => `- ${cat}: R$ ${data.total.toFixed(2)} (${data.count} transações)`)
      .join('\n')
  },

  /**
   * Generate action plan for critical cash flow situation
   */
  async generateActionPlan(userId: string, daysUntilZero: number, currentBalance: number, monthlyBurn: number): Promise<any[]> {
    try {
      console.log(`[AI] Generating action plan for critical situation: ${daysUntilZero} days until zero`)

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          action: 'generate-action-plan',
          userId,
          daysUntilZero,
          currentBalance,
          monthlyBurn,
        },
      })

      if (error) {
        throw new Error(error.message || 'Edge Function error')
      }

      console.log('[AI] Generated', data?.length || 0, 'action items')
      return data || []
    } catch (error: any) {
      console.error('[AI] Error generating action plan:', error)
      throw new Error(`Failed to generate action plan: ${error.message}`)
    }
  },

  /**
   * Create prompt for action plan generation (OPTIMIZED: -62% tokens)
   */
  createActionPlanPrompt(data: any, daysUntilZero: number, currentBalance: number, monthlyBurn: number): string {
    const summary = this.preprocessFinancialData(data)

    return `🚨 CRÍTICO: Saldo R$ ${currentBalance.toFixed(0)} zera em ${daysUntilZero}d | Queima R$ ${monthlyBurn.toFixed(0)}/mês

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
  },

  /**
   * Get fallback insights when OpenAI API fails
   */
  getFallbackInsights(): AIInsight[] {
    console.log('[AI] Returning fallback insights (OpenAI unavailable)')
    return [
      {
        id: 'fallback-1',
        title: 'Serviço de IA temporariamente indisponível',
        description: 'Estamos com dificuldades para conectar ao serviço de análise de IA. Seus dados estão seguros e você pode continuar usando o dashboard normalmente.',
        category: 'risk',
        severity: 'low',
        confidence: 100
      },
      {
        id: 'fallback-2',
        title: 'Análise básica disponível',
        description: 'Enquanto isso, use os gráficos de projeção de fluxo de caixa e metas financeiras para acompanhar sua situação financeira.',
        category: 'opportunity',
        severity: 'low',
        confidence: 100
      }
    ]
  },

  /**
   * Save AI analysis to database (ai_analysis_results table)
   */
  async saveAnalysisToDatabase(
    userId: string,
    data: {
      insights: AIInsight[]
      balancePrediction: BalancePrediction | null
      anomalies: AnomalyDetection[]
      spendingPatterns: SpendingPattern[]
      currentBalance: number
      totalRevenue: number
      totalExpenses: number
      daysUntilZero: number
      transactionCount: number
    }
  ): Promise<{ success: boolean; analysisId?: string; error?: string }> {
    try {
      console.log('[AI] Saving analysis to database...')

      // Format insights for database
      const formattedInsights = {
        summary: data.insights.length > 0
          ? `Análise financeira completa com ${data.insights.length} insights gerados.`
          : 'Análise financeira em andamento.',
        warnings: data.insights
          .filter(i => i.severity === 'high' || i.category === 'risk')
          .map(i => i.description)
          .slice(0, 5),
        recommendations: data.insights
          .filter(i => i.category === 'opportunity' || i.severity === 'low')
          .map(i => i.description)
          .slice(0, 5)
      }

      // Format anomalies
      const formattedAnomalies = data.anomalies.map(a => ({
        description: a.transaction_description,
        amount: a.amount,
        date: a.date,
        reason: a.reason,
        severity: a.severity
      }))

      // Format spending patterns
      const formattedPatterns = data.spendingPatterns.map(p => ({
        category: p.category,
        average_amount: p.average_amount,
        trend: p.trend,
        insights: p.insights
      }))

      // Insert into database
      const { data: result, error } = await supabase
        .from('ai_analysis_results' as any)
        .insert({
          user_id: userId,
          status: 'completed',
          current_balance: data.currentBalance,
          total_revenue: data.totalRevenue,
          total_expenses: data.totalExpenses,
          days_until_zero: data.daysUntilZero > 0 ? data.daysUntilZero : null,
          insights: formattedInsights,
          balance_prediction: data.balancePrediction,
          anomalies: formattedAnomalies,
          spending_patterns: formattedPatterns,
          transaction_count: data.transactionCount,
          analysis_date: new Date().toISOString()
        } as any)
        .select()
        .single() as { data: any | null, error: any }

      if (error) {
        console.error('[AI] Error saving to database:', error)
        return { success: false, error: error.message }
      }

      console.log('[AI] Analysis saved successfully:', result?.id)

      // Create alerts for critical issues
      if (result?.id) {
        await this.createAlertsFromAnalysis(userId, result.id, data)
      }

      return { success: true, analysisId: result?.id }
    } catch (error: any) {
      console.error('[AI] Error in saveAnalysisToDatabase:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Create alerts from analysis results
   */
  async createAlertsFromAnalysis(
    userId: string,
    analysisId: string,
    data: {
      insights: AIInsight[]
      anomalies: AnomalyDetection[]
      daysUntilZero: number
    }
  ): Promise<void> {
    try {
      const alerts: any[] = []

      // Critical insights
      const criticalInsights = data.insights.filter(i => i.severity === 'high')
      for (const insight of criticalInsights.slice(0, 3)) {
        alerts.push({
          user_id: userId,
          analysis_id: analysisId,
          type: 'critical',
          title: insight.title,
          message: insight.description,
          action_required: true
        })
      }

      // High severity anomalies
      const highAnomalies = data.anomalies.filter(a => a.severity === 'high')
      for (const anomaly of highAnomalies.slice(0, 2)) {
        alerts.push({
          user_id: userId,
          analysis_id: analysisId,
          type: 'warning',
          title: 'Anomalia Detectada',
          message: `${anomaly.transaction_description} - ${anomaly.reason}`,
          action_required: true
        })
      }

      // Days until zero warning
      if (data.daysUntilZero > 0 && data.daysUntilZero < 30) {
        alerts.push({
          user_id: userId,
          analysis_id: analysisId,
          type: data.daysUntilZero < 15 ? 'critical' : 'warning',
          title: 'Alerta de Fluxo de Caixa',
          message: `Seu caixa pode zerar em ${data.daysUntilZero} dias se mantiver o ritmo atual de gastos. Revise suas despesas urgentemente.`,
          action_required: true
        })
      }

      if (alerts.length > 0) {
        const { error } = await supabase
          .from('ai_alerts' as any)
          .insert(alerts as any)

        if (error) {
          console.error('[AI] Error creating alerts:', error)
        } else {
          console.log(`[AI] Created ${alerts.length} alerts`)
        }
      }
    } catch (error) {
      console.error('[AI] Error in createAlertsFromAnalysis:', error)
    }
  },

  /**
   * Chat with AI using financial context
   */
  async chat(userId: string, messages: any[]): Promise<{ content: string; command?: any }> {
    try {
      // Create AbortController for timeout (60 seconds)
      // const controller = new AbortController()
      // const timeoutId = setTimeout(() => controller.abort(), 60000)

      // Force timeout after 45 seconds using Promise.race
      const invokeOperation = supabase.functions.invoke('ai-insights', {
        body: {
          action: 'chat',
          userId,
          messages,
        },
      });

      const timeoutOperation = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Tempo limite excedido (45s)')), 45000);
      });

      console.log('[AI Debug] Sending chat request...');
      // @ts-ignore
      const { data, error } = await Promise.race([invokeOperation, timeoutOperation]);

      if (error) throw new Error(error.message)

      const content = data.content
      console.log('[AI Debug] Raw content:', content); // Debug log
      let command = null

      // extract JSON block if exists (more robust regex)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch && jsonMatch[1]) {
        try {
          command = JSON.parse(jsonMatch[1])
        } catch (e) {
          console.error('Failed to parse AI command JSON', e)
        }
      }

      // Remove JSON block from content to show only text to user
      const cleanContent = content.replace(/```(?:json)?\s*[\s\S]*?\s*```/, '').trim()

      return {
        content: cleanContent,
        command
      }

    } catch (error: any) {
      console.error('[AI] Chat error:', error)
      throw error
    }
  }
}
