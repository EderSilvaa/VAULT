// VAULT TAX - TypeScript Type Definitions

export type TaxRegime = 'simples_nacional' | 'presumido' | 'real' | 'mei'

export type SimplesAnexo = 'I' | 'II' | 'III' | 'IV' | 'V'

// Reforma Tributária: novo tipo para IBS/CBS
export type TaxRegimeVersion = 'current' | 'transition' | 'reform'

export type PostReformRegime =
  | 'simples_nacional_unificado'
  | 'regime_geral'
  | 'mei_reform'

export type TaxType =
  | 'das'
  | 'darf_irpj'
  | 'darf_iss'
  | 'darf_inss'
  | 'ibs'  // Novo: Imposto sobre Bens e Serviços (reforma)
  | 'cbs'  // Novo: Contribuição sobre Bens e Serviços (reforma)
  | 'other'

export type CalculationType = 'automatic' | 'manual' | 'hybrid'

export type TaxCalculationStatus = 'draft' | 'confirmed' | 'paid' | 'overdue'

export type TaxPaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export type TaxAlertType =
  | 'deadline_approaching'
  | 'payment_overdue'
  | 'regime_optimization'
  | 'bracket_change'
  | 'high_burden'

export type TaxAlertSeverity = 'critical' | 'warning' | 'info'

export type OptimizationAction = 'accepted' | 'rejected' | 'pending'

// ============================================================
// TAX SETTINGS
// ============================================================

export interface TaxSettings {
  id: string
  userId: string

  // Regime tributário (atual ou pós-reforma)
  regime: TaxRegime
  simples_anexo?: SimplesAnexo
  simples_revenue_bracket?: number

  // ISS (sistema atual - válido até 2033)
  iss_rate: number
  iss_municipality?: string

  // INSS
  has_employees: boolean
  employee_count: number
  prolabore_amount?: number

  // Reforma Tributária (LC 68/2024)
  tax_regime_version?: TaxRegimeVersion // 'current' | 'transition' | 'reform'
  ibs_rate?: number // Substitui ISS (alíquota estimada: ~17.7%)
  ibs_state?: string
  cbs_rate?: number // Substitui PIS/COFINS (alíquota estimada: ~8.8%)
  transition_year?: number // Ano de transição (2026-2033)
  eligible_for_cashback?: boolean // Devolução para baixa renda
  post_reform_regime?: PostReformRegime

  // Histórico de mudanças
  regime_history?: RegimeChange[]

  // Metadata
  created_at: string
  updated_at: string
}

export interface RegimeChange {
  regime: TaxRegime
  start_date: string
  end_date?: string
  reason?: string
}

export interface TaxSettingsInput {
  regime: TaxRegime
  simples_anexo?: SimplesAnexo
  iss_rate?: number
  iss_municipality?: string
  has_employees?: boolean
  employee_count?: number
  prolabore_amount?: number

  // Reforma Tributária (LC 68/2024)
  tax_regime_version?: TaxRegimeVersion
  ibs_rate?: number
  ibs_state?: string
  cbs_rate?: number
  transition_year?: number
  eligible_for_cashback?: boolean
  post_reform_regime?: PostReformRegime
}

// ============================================================
// TAX CALCULATIONS
// ============================================================

export interface TaxCalculation {
  id: string
  userId: string

  // Período
  month: number
  year: number

  // Valores (sistema atual - até 2033)
  das_amount: number
  irpj_amount: number
  iss_amount: number
  inss_amount: number

  // Valores (reforma tributária - a partir de 2026)
  ibs_amount?: number // Substitui ISS
  cbs_amount?: number // Substitui PIS/COFINS

  // Total (inclui ambos os sistemas se em transição)
  total_tax_amount: number

  // Metadados
  calculation_type: CalculationType
  is_manual_override: boolean

  // Reforma: qual sistema foi usado
  tax_system_version?: TaxRegimeVersion
  transition_percentage?: number // % do novo sistema (ex: 2027 = 10%)

  // Base de cálculo
  revenue_base?: number
  revenue_last_12m?: number

  // Detalhes
  calculation_details?: TaxCalculationDetails

  // Status
  status: TaxCalculationStatus

  // Metadata
  created_at: string
  updated_at: string
  calculated_at?: string
}

export interface TaxCalculationDetails {
  das?: {
    das_amount: number
    revenue_month: number
    revenue_12m: number
    rate: number
    anexo?: SimplesAnexo
    bracket_min?: number
    bracket_max?: number
  }
  iss?: {
    iss_amount: number
    service_revenue: number
    rate: number
  }
  inss?: {
    inss_amount: number
    prolabore: number
    rate: number
  }
  total_tax?: number
  month?: number
  year?: number
  error?: string
}

export interface TaxCalculationInput {
  month: number
  year: number
  das_amount?: number
  iss_amount?: number
  inss_amount?: number
  irpj_amount?: number
}

// ============================================================
// TAX PAYMENTS
// ============================================================

export interface TaxPayment {
  id: string
  userId: string
  calculation_id?: string

  // Detalhes
  tax_type: TaxType
  amount: number
  due_date: string

  // Status
  status: TaxPaymentStatus
  paid_at?: string
  paid_amount?: number

  // Comprovante
  payment_code?: string
  transaction_id?: string

  // Alertas
  alert_sent: boolean
  alert_sent_at?: string

  // Metadata
  created_at: string
  updated_at: string
}

export interface TaxPaymentInput {
  calculation_id?: string
  tax_type: TaxType
  amount: number
  due_date: string
  payment_code?: string
}

// ============================================================
// TAX ALERTS
// ============================================================

export interface TaxAlert {
  id: string
  userId: string
  payment_id?: string

  // Tipo e severidade
  type: TaxAlertType
  severity: TaxAlertSeverity

  // Conteúdo
  title: string
  message: string

  // Status
  is_read: boolean
  is_dismissed: boolean
  read_at?: string

  // Dados relacionados
  related_data?: any

  // Metadata
  created_at: string
}

export interface TaxAlertInput {
  payment_id?: string
  type: TaxAlertType
  severity: TaxAlertSeverity
  title: string
  message: string
  related_data?: any
}

// ============================================================
// TAX OPTIMIZATION
// ============================================================

export interface TaxOptimization {
  id: string
  userId: string

  // Análise
  analysis_date: string

  // Regimes
  current_regime: string
  suggested_regime: string

  // Impacto financeiro
  current_annual_tax: number
  projected_annual_tax: number
  potential_savings: number
  savings_percentage: number

  // Recomendação
  recommendation: string
  reasoning: OptimizationReasoning
  confidence: number

  // Ação do usuário
  user_action?: OptimizationAction
  action_date?: string

  // Metadata
  created_at: string
}

export interface OptimizationReasoning {
  factors: string[]
  pros: string[]
  cons: string[]
  considerations?: string[]
}

export interface TaxOptimizationRequest {
  current_regime: TaxRegime
  annual_revenue: number
  annual_expenses: number
  profit_margin: number
}

// ============================================================
// SIMPLES NACIONAL RATES
// ============================================================

export interface SimplesNacionalRate {
  id: string
  anexo: SimplesAnexo
  bracket_min: number
  bracket_max: number
  rate: number
  deduction: number
  description?: string
}

// ============================================================
// DASHBOARD / UI DATA
// ============================================================

export interface TaxDashboardData {
  // KPIs
  current_month_tax: number
  next_payment_due: string | null
  tax_burden_percentage: number
  potential_savings: number

  // Alertas
  pending_alerts: number
  critical_alerts: number

  // Próximos vencimentos
  upcoming_payments: TaxPayment[]

  // Cálculo atual
  current_calculation?: TaxCalculation

  // Otimização
  latest_optimization?: TaxOptimization
}

export interface MonthlyTaxSummary {
  month: string
  year: number
  total_tax: number
  das: number
  iss: number
  inss: number
  revenue: number
  tax_burden: number // %
}

export interface TaxProjection {
  month: number
  year: number
  projected_revenue: number
  estimated_das: number
  estimated_iss: number
  estimated_inss: number
  total_tax: number
}

// ============================================================
// FORMS & VALIDATION
// ============================================================

export interface TaxSettingsFormData {
  regime: TaxRegime
  simples_anexo?: SimplesAnexo
  iss_rate: number
  iss_municipality?: string
  has_employees: boolean
  employee_count: number
  prolabore_amount?: number
}

export interface TaxCalculationFormData {
  month: number
  year: number
  das_amount?: number
  iss_amount?: number
  inss_amount?: number
}

// ============================================================
// API RESPONSES
// ============================================================

export interface CalculateTaxResponse {
  success: boolean
  data?: TaxCalculationDetails
  error?: string
}

export interface SaveTaxCalculationResponse {
  success: boolean
  calculation_id?: string
  error?: string
}

export interface TaxOptimizationResponse {
  success: boolean
  optimization?: TaxOptimization
  error?: string
}

// ============================================================
// HELPER TYPES
// ============================================================

export interface TaxBreakdown {
  name: string
  amount: number
  percentage: number
  color: string
}

export interface TaxTrend {
  period: string
  amount: number
  change: number // % change from previous period
}
