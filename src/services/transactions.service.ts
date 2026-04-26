// Transactions Service
import { supabase } from '@/lib/supabase'
import type { Transaction } from '@/types'
import type { TransactionInput } from '@/lib/validations'

export const transactionsService = {
  /**
   * Get all transactions for current user
   */
  async getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data.map(t => ({
      id: t.id,
      userId: t.user_id,
      type: t.type as 'income' | 'expense',
      amount: Number(t.amount),
      description: t.description,
      category: t.category,
      date: t.date,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))
  },

  /**
   * Get transactions by date range
   */
  async getTransactionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (error) throw error

    return data.map(t => ({
      id: t.id,
      userId: t.user_id,
      type: t.type as 'income' | 'expense',
      amount: Number(t.amount),
      description: t.description,
      category: t.category,
      date: t.date,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))
  },

  /**
   * Create new transaction
   */
  async createTransaction(userId: string, input: TransactionInput): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions' as any)
      .insert({
        user_id: userId,
        type: input.type,
        amount: input.amount,
        description: input.description,
        category: input.category,
        date: input.date || new Date().toISOString(),
        source_id: input.source_id || null,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type as 'income' | 'expense',
      amount: Number(data.amount),
      description: data.description,
      category: data.category,
      date: data.date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * Create multiple transactions (Batch)
   * Filters out duplicates by source_id before inserting.
   *
   * Gmail source_ids historically used `gmail:<msgId>` and now use
   * `gmail:<email>:<msgId>` (multi-account). We dedupe by extracting the
   * trailing message ID so legacy and new entries don't get re-inserted.
   */
  async createTransactions(userId: string, inputs: TransactionInput[]): Promise<Transaction[]> {
    const sourceIds = inputs.map(i => i.source_id).filter(Boolean) as string[]
    const hasGmail = sourceIds.some(id => id.startsWith('gmail:'))
    const nonGmailIds = sourceIds.filter(id => !id.startsWith('gmail:'))

    const existingExact = new Set<string>()
    const existingGmailMsgIds = new Set<string>()

    // Non-gmail: exact-match check
    if (nonGmailIds.length > 0) {
      const { data: existing } = await supabase
        .from('transactions')
        .select('source_id')
        .eq('user_id', userId)
        .in('source_id', nonGmailIds)
      ;(existing ?? []).forEach((r: any) => existingExact.add(r.source_id))
    }

    // Gmail: fetch all gmail entries for this user, dedupe by trailing msgId
    if (hasGmail) {
      const { data: existingGmail } = await supabase
        .from('transactions')
        .select('source_id')
        .eq('user_id', userId)
        .like('source_id', 'gmail:%')
      ;(existingGmail ?? []).forEach((r: any) => {
        const parts = r.source_id.split(':')
        const msgId = parts[parts.length - 1]
        if (msgId) existingGmailMsgIds.add(msgId)
      })
    }

    const newInputs = inputs.filter(i => {
      if (!i.source_id) return true
      if (i.source_id.startsWith('gmail:')) {
        const parts = i.source_id.split(':')
        const msgId = parts[parts.length - 1]
        return !existingGmailMsgIds.has(msgId)
      }
      return !existingExact.has(i.source_id)
    })

    if (newInputs.length === 0) return []

    const { data, error } = await supabase
      .from('transactions' as any)
      .insert(
        newInputs.map(input => ({
          user_id: userId,
          type: input.type,
          amount: input.amount,
          description: input.description,
          category: input.category,
          date: input.date || new Date().toISOString(),
          source_id: input.source_id || null,
        }))
      )
      .select()

    if (error) throw error

    return data.map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      type: t.type as 'income' | 'expense',
      amount: Number(t.amount),
      description: t.description,
      category: t.category,
      date: t.date,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))
  },

  /**
   * Update transaction
   */
  async updateTransaction(
    transactionId: string,
    updates: Partial<TransactionInput>
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions' as any)
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type as 'income' | 'expense',
      amount: Number(data.amount),
      description: data.description,
      category: data.category,
      date: data.date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * Delete transaction
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)

    if (error) throw error
  },

  /**
   * Get monthly stats
   */
  async getMonthlyStats(userId: string) {
    const { data, error } = await supabase.rpc('get_monthly_stats', {
      p_user_id: userId,
    })

    if (error) throw error

    return {
      totalIncome: Number(data[0]?.total_income || 0),
      totalExpenses: Number(data[0]?.total_expenses || 0),
      transactionCount: Number(data[0]?.transaction_count || 0),
    }
  },

  /**
   * Get current balance
   */
  async getCurrentBalance(userId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_current_balance', {
      p_user_id: userId,
    })

    if (error) throw error

    return Number(data || 0)
  },

  /**
   * Get transactions by category
   */
  async getTransactionsByCategory(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('category, type, amount')
      .eq('user_id', userId)

    if (error) throw error

    // Group by category
    const grouped = data.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { income: 0, expense: 0 }
      }
      if (t.type === 'income') {
        acc[t.category].income += Number(t.amount)
      } else {
        acc[t.category].expense += Number(t.amount)
      }
      return acc
    }, {} as Record<string, { income: number; expense: number }>)

    return grouped
  },
}
