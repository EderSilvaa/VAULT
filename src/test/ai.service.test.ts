import { describe, it, expect } from 'vitest'
import { aiService } from '@/services/ai.service'

// Dados fictícios para testes
const mockTransactions = [
  { type: 'income', amount: 5000, description: 'Cliente A', category: 'Vendas', date: '2026-03-01' },
  { type: 'income', amount: 3000, description: 'Cliente B', category: 'Vendas', date: '2026-02-15' },
  { type: 'expense', amount: 1200, description: 'Aluguel', category: 'Fixo', date: '2026-03-05' },
  { type: 'expense', amount: 800, description: 'Fornecedor X', category: 'Fornecedores', date: '2026-02-20' },
  { type: 'expense', amount: 150, description: 'Internet', category: 'Fixo', date: '2026-03-10' },
  { type: 'expense', amount: 9999, description: 'Equipamento caro', category: 'Outros', date: '2026-03-15' },
]

const mockFinancialData = {
  transactions: mockTransactions as any[],
  currentBalance: 5850,
  income: 8000,
  expenses: 12149,
  period: {
    start: '2025-12-28T00:00:00.000Z',
    end: '2026-03-28T00:00:00.000Z',
    days: 90,
  },
}

// ============================================================
// preprocessFinancialData
// ============================================================
describe('aiService.preprocessFinancialData', () => {
  it('retorna top categorias de despesa', () => {
    const result = aiService.preprocessFinancialData(mockFinancialData)
    expect(result.topCategories).toContain('Fixo')
    expect(result.topCategories).toContain('Outros')
  })

  it('retorna transações recentes de alto valor', () => {
    const result = aiService.preprocessFinancialData(mockFinancialData)
    expect(result.recentHighValue).toContain('Equipamento caro')
  })

  it('retorna categoryBreakdown com valores numéricos', () => {
    const result = aiService.preprocessFinancialData(mockFinancialData)
    expect(result.categoryBreakdown).toMatch(/R\$/)
  })

  it('lida com transações sem despesas', () => {
    const data = { ...mockFinancialData, transactions: mockTransactions.filter(t => t.type === 'income') as any[] }
    const result = aiService.preprocessFinancialData(data)
    expect(result.topCategories).toBe('')
  })
})

// ============================================================
// createInsightsPrompt
// ============================================================
describe('aiService.createInsightsPrompt', () => {
  it('inclui saldo, receita e despesa no prompt', () => {
    const prompt = aiService.createInsightsPrompt(mockFinancialData)
    expect(prompt).toContain('5850')
    expect(prompt).toContain('8000')
  })

  it('retorna string não vazia', () => {
    const prompt = aiService.createInsightsPrompt(mockFinancialData)
    expect(prompt.length).toBeGreaterThan(50)
  })
})

// ============================================================
// createBalancePredictionPrompt
// ============================================================
describe('aiService.createBalancePredictionPrompt', () => {
  it('inclui número de dias na previsão', () => {
    const prompt = aiService.createBalancePredictionPrompt(mockFinancialData, 30)
    expect(prompt).toContain('30')
  })

  it('inclui saldo atual', () => {
    const prompt = aiService.createBalancePredictionPrompt(mockFinancialData, 30)
    expect(prompt).toContain('5850')
  })
})

// ============================================================
// summarizeByCategory (legacy)
// ============================================================
describe('aiService.summarizeByCategory', () => {
  it('agrupa despesas por categoria corretamente', () => {
    const summary = aiService.summarizeByCategory(mockTransactions as any[])
    expect(summary).toContain('Fixo')
    expect(summary).toContain('1350')  // 1200 + 150
    expect(summary).toContain('Fornecedores')
  })

  it('ignora transações de receita', () => {
    const summary = aiService.summarizeByCategory(mockTransactions as any[])
    expect(summary).not.toContain('Cliente A')
    expect(summary).not.toContain('Vendas')
  })

  it('retorna string vazia para array vazio', () => {
    const summary = aiService.summarizeByCategory([])
    expect(summary).toBe('')
  })
})

// ============================================================
// isConfigured
// ============================================================
describe('aiService.isConfigured', () => {
  it('retorna true (Edge Functions não precisam de key local)', () => {
    expect(aiService.isConfigured()).toBe(true)
  })
})

// ============================================================
// getFallbackInsights
// ============================================================
describe('aiService.getFallbackInsights', () => {
  it('retorna array com pelo menos 1 insight', () => {
    const insights = aiService.getFallbackInsights()
    expect(insights.length).toBeGreaterThanOrEqual(1)
  })

  it('cada insight tem title e description', () => {
    const insights = aiService.getFallbackInsights()
    insights.forEach(insight => {
      expect(insight.title).toBeTruthy()
      expect(insight.description).toBeTruthy()
    })
  })

  it('insights de fallback têm severidade low', () => {
    const insights = aiService.getFallbackInsights()
    insights.forEach(insight => {
      expect(insight.severity).toBe('low')
    })
  })
})
