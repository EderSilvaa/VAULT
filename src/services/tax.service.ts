// Tax Service - API calls for tax management
import { supabase } from '@/lib/supabase'
import type {
  TaxSettings,
  TaxCalculation,
  TaxPayment,
  TaxAlert,
  TaxOptimization,
  TaxSettingsInput,
  TaxCalculationInput,
  TaxPaymentInput,
  TaxCalculationDetails,
  SimplesNacionalRate,
} from '@/types/tax'

export const taxService = {
  // ============================================================
  // TAX SETTINGS
  // ============================================================

  /**
   * Get user's tax settings
   */
  async getSettings(userId: string): Promise<TaxSettings | null> {
    const { data, error } = await supabase
      .from('tax_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    if (!data) return null

    return {
      id: data.id,
      userId: data.user_id,
      regime: data.regime,
      simples_anexo: data.simples_anexo,
      simples_revenue_bracket: data.simples_revenue_bracket,
      iss_rate: Number(data.iss_rate),
      iss_municipality: data.iss_municipality,
      has_employees: data.has_employees,
      employee_count: data.employee_count,
      prolabore_amount: data.prolabore_amount ? Number(data.prolabore_amount) : undefined,
      // Reforma Tributária
      tax_regime_version: data.tax_regime_version,
      ibs_rate: data.ibs_rate ? Number(data.ibs_rate) : undefined,
      ibs_state: data.ibs_state,
      cbs_rate: data.cbs_rate ? Number(data.cbs_rate) : undefined,
      transition_year: data.transition_year,
      eligible_for_cashback: data.eligible_for_cashback,
      post_reform_regime: data.post_reform_regime,
      regime_history: data.regime_history || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  },

  /**
   * Create or update tax settings
   */
  async updateSettings(userId: string, settings: TaxSettingsInput): Promise<TaxSettings> {
    const { data, error } = await supabase
      .from('tax_settings')
      .upsert(
        {
          user_id: userId,
          regime: settings.regime,
          simples_anexo: settings.simples_anexo,
          iss_rate: settings.iss_rate || 2.0,
          iss_municipality: settings.iss_municipality,
          has_employees: settings.has_employees || false,
          employee_count: settings.employee_count || 0,
          prolabore_amount: settings.prolabore_amount,
          // Reforma Tributária
          tax_regime_version: settings.tax_regime_version,
          ibs_rate: settings.ibs_rate,
          ibs_state: settings.ibs_state,
          cbs_rate: settings.cbs_rate,
          transition_year: settings.transition_year,
          eligible_for_cashback: settings.eligible_for_cashback,
          post_reform_regime: settings.post_reform_regime,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      regime: data.regime,
      simples_anexo: data.simples_anexo,
      simples_revenue_bracket: data.simples_revenue_bracket,
      iss_rate: Number(data.iss_rate),
      iss_municipality: data.iss_municipality,
      has_employees: data.has_employees,
      employee_count: data.employee_count,
      prolabore_amount: data.prolabore_amount ? Number(data.prolabore_amount) : undefined,
      // Reforma Tributária
      tax_regime_version: data.tax_regime_version,
      ibs_rate: data.ibs_rate ? Number(data.ibs_rate) : undefined,
      ibs_state: data.ibs_state,
      cbs_rate: data.cbs_rate ? Number(data.cbs_rate) : undefined,
      transition_year: data.transition_year,
      eligible_for_cashback: data.eligible_for_cashback,
      post_reform_regime: data.post_reform_regime,
      regime_history: data.regime_history || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  },

  // ============================================================
  // TAX CALCULATIONS
  // ============================================================

  /**
   * Calculate taxes for a specific month using RPC function
   */
  async calculateMonthlyTax(
    userId: string,
    month: number,
    year: number
  ): Promise<TaxCalculationDetails> {
    const { data, error } = await supabase.rpc('calculate_monthly_tax', {
      p_user_id: userId,
      p_month: month,
      p_year: year,
    })

    if (error) throw error

    return data as TaxCalculationDetails
  },

  /**
   * Save tax calculation to database
   */
  async saveCalculation(
    userId: string,
    month: number,
    year: number,
    calculationResult: TaxCalculationDetails
  ): Promise<string> {
    const { data, error } = await supabase.rpc('save_tax_calculation', {
      p_user_id: userId,
      p_month: month,
      p_year: year,
      p_calculation_result: calculationResult as any,
    })

    if (error) throw error

    return data as string
  },

  /**
   * Get tax calculations for a date range
   */
  async getCalculations(
    userId: string,
    startYear?: number,
    startMonth?: number,
    endYear?: number,
    endMonth?: number
  ): Promise<TaxCalculation[]> {
    let query = supabase
      .from('tax_calculations')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    // Correct year-month range: independent .gte('year').gte('month') is wrong across year boundaries
    // e.g. year>=2024 AND month>=11 misses Jan 2025 (month=1 < 11)
    // Fix: (year > startYear) OR (year = startYear AND month >= startMonth)
    if (startYear && startMonth) {
      query = query.or(`year.gt.${startYear},and(year.eq.${startYear},month.gte.${startMonth})`)
    }

    if (endYear && endMonth) {
      query = query.or(`year.lt.${endYear},and(year.eq.${endYear},month.lte.${endMonth})`)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map((calc) => ({
      id: calc.id,
      userId: calc.user_id,
      month: calc.month,
      year: calc.year,
      das_amount: Number(calc.das_amount),
      irpj_amount: Number(calc.irpj_amount),
      iss_amount: Number(calc.iss_amount),
      inss_amount: Number(calc.inss_amount),
      total_tax_amount: Number(calc.total_tax_amount),
      calculation_type: calc.calculation_type,
      is_manual_override: calc.is_manual_override,
      revenue_base: calc.revenue_base ? Number(calc.revenue_base) : undefined,
      revenue_last_12m: calc.revenue_last_12m ? Number(calc.revenue_last_12m) : undefined,
      calculation_details: calc.calculation_details,
      status: calc.status,
      created_at: calc.created_at,
      updated_at: calc.updated_at,
      calculated_at: calc.calculated_at,
    }))
  },

  /**
   * Get single tax calculation
   */
  async getCalculation(userId: string, month: number, year: number): Promise<TaxCalculation | null> {
    const { data, error } = await supabase
      .from('tax_calculations')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (error) throw error

    if (!data) return null

    return {
      id: data.id,
      userId: data.user_id,
      month: data.month,
      year: data.year,
      das_amount: Number(data.das_amount),
      irpj_amount: Number(data.irpj_amount),
      iss_amount: Number(data.iss_amount),
      inss_amount: Number(data.inss_amount),
      total_tax_amount: Number(data.total_tax_amount),
      calculation_type: data.calculation_type,
      is_manual_override: data.is_manual_override,
      revenue_base: data.revenue_base ? Number(data.revenue_base) : undefined,
      revenue_last_12m: data.revenue_last_12m ? Number(data.revenue_last_12m) : undefined,
      calculation_details: data.calculation_details,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      calculated_at: data.calculated_at,
    }
  },

  /**
   * Update tax calculation (manual override)
   */
  async updateCalculation(
    calculationId: string,
    updates: Partial<TaxCalculationInput>
  ): Promise<TaxCalculation> {
    const { data, error } = await supabase
      .from('tax_calculations')
      .update({
        ...updates,
        is_manual_override: true,
        calculation_type: 'hybrid',
      })
      .eq('id', calculationId)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      month: data.month,
      year: data.year,
      das_amount: Number(data.das_amount),
      irpj_amount: Number(data.irpj_amount),
      iss_amount: Number(data.iss_amount),
      inss_amount: Number(data.inss_amount),
      total_tax_amount: Number(data.total_tax_amount),
      calculation_type: data.calculation_type,
      is_manual_override: data.is_manual_override,
      revenue_base: data.revenue_base ? Number(data.revenue_base) : undefined,
      revenue_last_12m: data.revenue_last_12m ? Number(data.revenue_last_12m) : undefined,
      calculation_details: data.calculation_details,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      calculated_at: data.calculated_at,
    }
  },

  /**
   * Delete tax calculation
   */
  async deleteCalculation(calculationId: string): Promise<void> {
    const { error } = await supabase.from('tax_calculations').delete().eq('id', calculationId)

    if (error) throw error
  },

  // ============================================================
  // TAX PAYMENTS
  // ============================================================

  /**
   * Get upcoming tax payments
   */
  async getUpcomingPayments(userId: string, days = 30): Promise<TaxPayment[]> {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    const { data, error } = await supabase
      .from('tax_payments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', futureDate.toISOString().split('T')[0])
      .order('due_date', { ascending: true })

    if (error) throw error

    return (data || []).map((payment) => ({
      id: payment.id,
      userId: payment.user_id,
      calculation_id: payment.calculation_id,
      tax_type: payment.tax_type,
      amount: Number(payment.amount),
      due_date: payment.due_date,
      status: payment.status,
      paid_at: payment.paid_at,
      paid_amount: payment.paid_amount ? Number(payment.paid_amount) : undefined,
      payment_code: payment.payment_code,
      transaction_id: payment.transaction_id,
      alert_sent: payment.alert_sent,
      alert_sent_at: payment.alert_sent_at,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
    }))
  },

  /**
   * Create tax payment
   */
  async createPayment(userId: string, payment: TaxPaymentInput): Promise<TaxPayment> {
    const { data, error } = await supabase
      .from('tax_payments')
      .insert({
        user_id: userId,
        calculation_id: payment.calculation_id,
        tax_type: payment.tax_type,
        amount: payment.amount,
        due_date: payment.due_date,
        payment_code: payment.payment_code,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      calculation_id: data.calculation_id,
      tax_type: data.tax_type,
      amount: Number(data.amount),
      due_date: data.due_date,
      status: data.status,
      paid_at: data.paid_at,
      paid_amount: data.paid_amount ? Number(data.paid_amount) : undefined,
      payment_code: data.payment_code,
      transaction_id: data.transaction_id,
      alert_sent: data.alert_sent,
      alert_sent_at: data.alert_sent_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  },

  /**
   * Mark payment as paid
   */
  async markPaymentPaid(
    paymentId: string,
    paidAmount: number,
    transactionId?: string
  ): Promise<TaxPayment> {
    const { data, error } = await supabase
      .from('tax_payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_amount: paidAmount,
        transaction_id: transactionId,
      })
      .eq('id', paymentId)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      calculation_id: data.calculation_id,
      tax_type: data.tax_type,
      amount: Number(data.amount),
      due_date: data.due_date,
      status: data.status,
      paid_at: data.paid_at,
      paid_amount: data.paid_amount ? Number(data.paid_amount) : undefined,
      payment_code: data.payment_code,
      transaction_id: data.transaction_id,
      alert_sent: data.alert_sent,
      alert_sent_at: data.alert_sent_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  },

  // ============================================================
  // TAX ALERTS
  // ============================================================

  /**
   * Get user's tax alerts
   */
  async getAlerts(userId: string, includeRead = false): Promise<TaxAlert[]> {
    let query = supabase
      .from('tax_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })

    if (!includeRead) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map((alert) => ({
      id: alert.id,
      userId: alert.user_id,
      payment_id: alert.payment_id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      is_read: alert.is_read,
      is_dismissed: alert.is_dismissed,
      read_at: alert.read_at,
      related_data: alert.related_data,
      created_at: alert.created_at,
    }))
  },

  /**
   * Mark alert as read
   */
  async markAlertRead(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('tax_alerts')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    if (error) throw error
  },

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('tax_alerts')
      .update({
        is_dismissed: true,
      })
      .eq('id', alertId)

    if (error) throw error
  },

  // ============================================================
  // TAX OPTIMIZATION
  // ============================================================

  /**
   * Request AI tax optimization
   */
  async requestOptimization(userId: string): Promise<TaxOptimization> {
    const { data, error } = await supabase.functions.invoke('ai-insights', {
      body: {
        action: 'optimize-tax-regime',
        userId,
      },
    })

    if (error) throw error

    return data as TaxOptimization
  },

  /**
   * Get optimization history
   */
  async getOptimizationHistory(userId: string, limit = 10): Promise<TaxOptimization[]> {
    const { data, error } = await supabase
      .from('tax_optimization_history')
      .select('*')
      .eq('user_id', userId)
      .order('analysis_date', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((opt) => ({
      id: opt.id,
      userId: opt.user_id,
      analysis_date: opt.analysis_date,
      current_regime: opt.current_regime,
      suggested_regime: opt.suggested_regime,
      current_annual_tax: Number(opt.current_annual_tax),
      projected_annual_tax: Number(opt.projected_annual_tax),
      potential_savings: Number(opt.potential_savings),
      savings_percentage: Number(opt.savings_percentage),
      recommendation: opt.recommendation,
      reasoning: opt.reasoning,
      confidence: Number(opt.confidence),
      user_action: opt.user_action,
      action_date: opt.action_date,
      created_at: opt.created_at,
    }))
  },

  /**
   * Accept or reject optimization suggestion
   */
  async respondToOptimization(
    optimizationId: string,
    action: 'accepted' | 'rejected'
  ): Promise<void> {
    const { error } = await supabase
      .from('tax_optimization_history')
      .update({
        user_action: action,
        action_date: new Date().toISOString(),
      })
      .eq('id', optimizationId)

    if (error) throw error
  },

  // ============================================================
  // SIMPLES NACIONAL RATES
  // ============================================================

  /**
   * Get Simples Nacional rates for a specific anexo
   */
  async getSimplesRates(anexo: string): Promise<SimplesNacionalRate[]> {
    const { data, error } = await supabase
      .from('simples_nacional_rates')
      .select('*')
      .eq('anexo', anexo)
      .order('bracket_min', { ascending: true })

    if (error) throw error

    return (data || []).map((rate) => ({
      id: rate.id,
      anexo: rate.anexo,
      bracket_min: Number(rate.bracket_min),
      bracket_max: Number(rate.bracket_max),
      rate: Number(rate.rate),
      deduction: Number(rate.deduction),
      description: rate.description,
    }))
  },
}
