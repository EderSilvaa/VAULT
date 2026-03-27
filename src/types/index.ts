// Application Types - Vault Caixa Alerta

export interface User {
  id: string
  email: string
  fullName: string | null
  companyName: string | null
  phone: string | null
}

export interface Transaction {
  id: string
  userId: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  createdAt?: string
  updatedAt?: string
}

export interface Projection {
  id: string
  userId: string
  projectionDate: string
  projectedBalance: number
  confidenceLevel: number
  createdAt?: string
}

export interface FinancialGoal {
  id: string
  userId: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  percentage?: number
  createdAt?: string
  updatedAt?: string
}

export interface AIInsight {
  id: string
  userId: string
  insightType: 'warning' | 'success' | 'danger' | 'info'
  title: string
  description: string
  action: string
  isRead: boolean
  createdAt?: string
}

export interface DashboardStats {
  currentBalance: number
  monthlyRevenue: number
  monthlyExpenses: number
  monthlySavings: number
  monthlyGrowth: number
  daysUntilZero: number | null
}

export interface ChartDataPoint {
  day: number
  balance: number
}

export interface RevenueExpenseData {
  month: string
  receita: number
  despesas: number
}

export type TransactionCategory =
  | 'Vendas'
  | 'Fornecedores'
  | 'Fixo'
  | 'Variável'
  | 'Receita'
  | 'Impostos'
  | 'Outros'

// Export tax types
export * from './tax'
