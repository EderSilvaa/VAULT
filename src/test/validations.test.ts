import { describe, it, expect } from 'vitest'
import {
  transactionSchema,
  financialGoalSchema,
  signupSchema,
  loginSchema,
  taxSettingsSchema,
  taxCalculationSchema,
} from '@/lib/validations'

// ============================================================
// TRANSACTION SCHEMA
// ============================================================
describe('transactionSchema', () => {
  it('aceita transação de receita válida', () => {
    const result = transactionSchema.safeParse({
      type: 'income',
      amount: 5000,
      description: 'Pagamento cliente',
      category: 'Vendas',
    })
    expect(result.success).toBe(true)
  })

  it('aceita transação de despesa válida', () => {
    const result = transactionSchema.safeParse({
      type: 'expense',
      amount: 150.5,
      description: 'Conta de luz',
      category: 'Fixo',
      date: '2026-03-01T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita amount negativo', () => {
    const result = transactionSchema.safeParse({
      type: 'expense',
      amount: -100,
      description: 'Teste',
      category: 'Outros',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Valor deve ser maior que zero')
  })

  it('rejeita amount zero', () => {
    const result = transactionSchema.safeParse({
      type: 'income',
      amount: 0,
      description: 'Teste',
      category: 'Outros',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita descrição muito curta', () => {
    const result = transactionSchema.safeParse({
      type: 'expense',
      amount: 100,
      description: 'ab',
      category: 'Outros',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Descrição deve ter pelo menos 3 caracteres')
  })

  it('rejeita tipo inválido', () => {
    const result = transactionSchema.safeParse({
      type: 'transferencia',
      amount: 100,
      description: 'Teste válido',
      category: 'Outros',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita amount acima do máximo', () => {
    const result = transactionSchema.safeParse({
      type: 'income',
      amount: 1_000_000_000,
      description: 'Valor absurdo',
      category: 'Outros',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Valor muito alto')
  })
})

// ============================================================
// FINANCIAL GOAL SCHEMA
// ============================================================
describe('financialGoalSchema', () => {
  it('aceita meta válida', () => {
    const result = financialGoalSchema.safeParse({
      title: 'Reserva de emergência',
      targetAmount: 10000,
      currentAmount: 2500,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita targetAmount negativo', () => {
    const result = financialGoalSchema.safeParse({
      title: 'Meta inválida',
      targetAmount: -500,
    })
    expect(result.success).toBe(false)
  })

  it('rejeita currentAmount negativo', () => {
    const result = financialGoalSchema.safeParse({
      title: 'Meta válida',
      targetAmount: 1000,
      currentAmount: -100,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Valor atual não pode ser negativo')
  })

  it('rejeita título muito curto', () => {
    const result = financialGoalSchema.safeParse({
      title: 'AB',
      targetAmount: 1000,
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// AUTH SCHEMAS
// ============================================================
describe('signupSchema', () => {
  it('aceita cadastro válido', () => {
    const result = signupSchema.safeParse({
      email: 'eder@vault.com',
      password: 'senha123',
      fullName: 'Eder Silva',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita email inválido', () => {
    const result = signupSchema.safeParse({
      email: 'nao-e-email',
      password: 'senha123',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Email inválido')
  })

  it('rejeita senha muito curta', () => {
    const result = signupSchema.safeParse({
      email: 'eder@vault.com',
      password: '123',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Senha deve ter pelo menos 6 caracteres')
  })
})

describe('loginSchema', () => {
  it('aceita login válido', () => {
    const result = loginSchema.safeParse({
      email: 'eder@vault.com',
      password: 'senha123',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita email vazio', () => {
    const result = loginSchema.safeParse({ email: '', password: 'senha123' })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// TAX SCHEMAS
// ============================================================
describe('taxSettingsSchema', () => {
  it('aceita configuração MEI válida', () => {
    const result = taxSettingsSchema.safeParse({
      regime: 'mei',
      has_employees: false,
      employee_count: 0,
      iss_rate: 2.0,
    })
    expect(result.success).toBe(true)
  })

  it('aceita Simples Nacional com anexo', () => {
    const result = taxSettingsSchema.safeParse({
      regime: 'simples_nacional',
      simples_anexo: 'III',
      iss_rate: 2.0,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita regime inválido', () => {
    const result = taxSettingsSchema.safeParse({ regime: 'lucro_real_v2' })
    expect(result.success).toBe(false)
  })

  it('rejeita ISS acima de 10%', () => {
    const result = taxSettingsSchema.safeParse({
      regime: 'mei',
      iss_rate: 15,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Taxa de ISS muito alta')
  })
})

describe('taxCalculationSchema', () => {
  it('aceita cálculo válido', () => {
    const result = taxCalculationSchema.safeParse({
      month: 3,
      year: 2026,
      das_amount: 72.5,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita mês inválido', () => {
    const result = taxCalculationSchema.safeParse({ month: 13, year: 2026 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Mês inválido')
  })

  it('rejeita ano muito antigo', () => {
    const result = taxCalculationSchema.safeParse({ month: 1, year: 2019 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Ano inválido')
  })
})
