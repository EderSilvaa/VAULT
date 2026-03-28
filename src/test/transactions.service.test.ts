import { describe, it, expect, vi, beforeEach } from 'vitest'
import { transactionsService } from '@/services/transactions.service'

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'

const mockTransaction = {
  id: 'uuid-123',
  user_id: 'user-456',
  type: 'income',
  amount: '5000.00',
  description: 'Pagamento cliente',
  category: 'Vendas',
  date: '2026-03-01T00:00:00.000Z',
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-01T00:00:00.000Z',
}

describe('transactionsService.getTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mapeia campos do banco para o formato correto', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [mockTransaction], error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as any)

    const result = await transactionsService.getTransactions('user-456')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'uuid-123',
      userId: 'user-456',
      type: 'income',
      amount: 5000,
      description: 'Pagamento cliente',
      category: 'Vendas',
    })
  })

  it('converte amount de string para number', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [{ ...mockTransaction, amount: '1234.56' }],
        error: null,
      }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as any)

    const result = await transactionsService.getTransactions('user-456')
    expect(result[0].amount).toBe(1234.56)
    expect(typeof result[0].amount).toBe('number')
  })

  it('lança erro quando supabase retorna erro', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as any)

    await expect(transactionsService.getTransactions('user-456')).rejects.toEqual({
      message: 'Connection failed',
    })
  })
})

describe('transactionsService.getTransactionsByCategory', () => {
  it('agrupa receitas e despesas por categoria', async () => {
    const mockData = [
      { category: 'Vendas', type: 'income', amount: '5000' },
      { category: 'Vendas', type: 'income', amount: '3000' },
      { category: 'Fixo', type: 'expense', amount: '1200' },
      { category: 'Fixo', type: 'expense', amount: '150' },
    ]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as any)

    const result = await transactionsService.getTransactionsByCategory('user-456')

    expect(result['Vendas'].income).toBe(8000)
    expect(result['Vendas'].expense).toBe(0)
    expect(result['Fixo'].expense).toBe(1350)
    expect(result['Fixo'].income).toBe(0)
  })
})

describe('transactionsService.getCurrentBalance', () => {
  it('retorna saldo como number', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: '5850.75', error: null } as any)

    const result = await transactionsService.getCurrentBalance('user-456')
    expect(result).toBe(5850.75)
    expect(typeof result).toBe('number')
  })

  it('retorna 0 quando data é null', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any)

    const result = await transactionsService.getCurrentBalance('user-456')
    expect(result).toBe(0)
  })
})
