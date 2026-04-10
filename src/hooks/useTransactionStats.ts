import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Transaction } from '@/types'

export interface TransactionStats {
  currentBalance: number
  totalRevenue: number
  totalExpenses: number
  monthlySavings: number
  monthlyGrowth: number
}

export interface MonthlyData {
  month: string
  receita: number
  despesas: number
}

export interface CashFlowProjection {
  day: number
  balance: number
}

export function useTransactionStats() {
  const { user } = useAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: ['transaction-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not found");

      // OPTIMIZED: Single query to fetch all transactions with date
      // Instead of 3 separate queries, fetch once and filter in memory
      const { data: allTransactions, error: allError } = await supabase
        .from('transactions' as any)
        .select('*') // Fetch all fields including category
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (allError) throw allError

      const transactions: Transaction[] = (allTransactions || []).map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        category: t.category,
        date: t.date,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }))

      // Get current month's start and end dates
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      // Get previous month's dates for comparison
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      // Filter transactions in memory (much faster than 3 separate DB queries)
      const currentMonthTransactions = transactions.filter(t => {
        if (!t.date) return false
        const date = new Date(t.date)
        return date >= currentMonthStart && date <= currentMonthEnd
      })

      const previousMonthTransactions = transactions.filter(t => {
        if (!t.date) return false
        const date = new Date(t.date)
        return date >= previousMonthStart && date <= previousMonthEnd
      })

      // Calculate current month stats
      const currentRevenue = currentMonthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const currentExpenses = currentMonthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      // Calculate previous month revenue for growth
      const previousRevenue = previousMonthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      // Calculate monthly growth percentage
      const growth = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0

      // Calculate current balance (all-time income - all-time expenses)
      const allTimeRevenue = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const allTimeExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      const balance = allTimeRevenue - allTimeExpenses

      const statsData: TransactionStats = {
        currentBalance: balance,
        totalRevenue: currentRevenue,
        totalExpenses: currentExpenses,
        monthlySavings: currentRevenue - currentExpenses,
        monthlyGrowth: Number(growth.toFixed(1)),
      }

      // Generate monthly data from the already-fetched transactions
      const monthlyData = generateMonthlyDataFromTransactions(transactions)

      // Generate cash flow projection from the same transactions (no extra query)
      const cashFlowProjection = await generateCashFlowProjection(balance, currentRevenue, currentExpenses, transactions)

      // Calculate days until zero (assuming calculateDaysUntilZero is defined elsewhere or will be added)
      // For now, we'll use a placeholder or assume it's a variable as per the instruction's snippet.
      // If calculateDaysUntilZero is a function, it should be called here.
      const daysUntilZero = calculateDaysUntilZero(statsData); // Assuming this function exists

      return {
        stats: statsData,
        monthlyData,
        cashFlowProjection,
        daysUntilZero,
        transactions,
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Helper functions moved inside (or could be outside if pure)

  const generateMonthlyDataFromTransactions = (transactions: Transaction[]): MonthlyData[] => {
    try {
      const now = new Date()
      const months: MonthlyData[] = []
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

      // Get last 6 months of data by filtering the already-fetched transactions
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

        // Filter transactions for this month (in memory, no DB query)
        const monthTransactions = transactions.filter(t => {
          if (!t.date) return false
          const date = new Date(t.date)
          return date >= monthStart && date <= monthEnd
        })

        const revenue = monthTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        const expenses = monthTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        months.push({
          month: monthNames[monthStart.getMonth()],
          receita: revenue,
          despesas: expenses,
        })
      }

      return months
    } catch (error: any) {
      console.error('Error generating monthly data:', error)
      return []
    }
  }

  const calculateDailyBalances = (transactions: Transaction[]) => {
    const dailyMap = new Map<string, number>()

    transactions.forEach(t => {
      if (!t.date) return
      const date = new Date(t.date).toISOString().split('T')[0]
      const current = dailyMap.get(date) || 0
      const change = t.type === 'income' ? t.amount : -t.amount
      dailyMap.set(date, current + change)
    })

    return Array.from(dailyMap.values())
  }

  const calculateLinearRegression = (values: number[]) => {
    const n = values.length
    if (n === 0) return { slope: 0, intercept: 0 }

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0

    values.forEach((y, x) => {
      sumX += x
      sumY += y
      sumXY += x * y
      sumX2 += x * x
    })

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope: slope || 0, intercept: intercept || 0 }
  }

  const calculateEMA = (values: number[], period: number) => {
    if (values.length === 0) return { value: 0, trend: 0 }

    const multiplier = 2 / (period + 1)
    let ema = values[0]

    for (let i = 1; i < values.length; i++) {
      ema = (values[i] - ema) * multiplier + ema
    }

    const recentValues = values.slice(-Math.min(7, values.length))
    const trend = recentValues.length > 1
      ? (recentValues[recentValues.length - 1] - recentValues[0]) / recentValues.length
      : 0

    return { value: ema, trend }
  }

  const detectRecurringTransactions = (transactions: Transaction[]) => {
    const patterns: Array<{ amount: number; frequency: number; type: 'income' | 'expense' }> = []
    const amountMap = new Map<number, number>()

    transactions.forEach(t => {
      const roundedAmount = Math.round(t.amount / 10) * 10
      const count = amountMap.get(roundedAmount) || 0
      amountMap.set(roundedAmount, count + 1)
    })

    amountMap.forEach((count, amount) => {
      if (count >= 3) {
        const matchingTransactions = transactions.filter(
          t => Math.abs(t.amount - amount) <= 10
        )
        const type = matchingTransactions[0]?.type || 'expense'
        const avgFrequency = 30

        patterns.push({ amount, frequency: avgFrequency, type })
      }
    })

    return patterns
  }

  const analyzeSeasonality = (transactions: Transaction[]) => {
    const monthlyTotals = new Array(12).fill(0)
    const monthlyCounts = new Array(12).fill(0)

    transactions.forEach(t => {
      if (!t.date) return
      const month = new Date(t.date).getMonth()
      const netChange = t.type === 'income' ? t.amount : -t.amount
      monthlyTotals[month] += netChange
      monthlyCounts[month]++
    })

    const monthlyAverages = monthlyTotals.map((total, i) =>
      monthlyCounts[i] > 0 ? total / monthlyCounts[i] : 0
    )

    const overallAverage = monthlyAverages.reduce((a, b) => a + b, 0) / 12
    const factors = monthlyAverages.map(avg =>
      overallAverage !== 0 ? avg / overallAverage : 1
    )

    return factors.map(f => isNaN(f) ? 1 : f)
  }

  const getRecurringAdjustment = (
    day: number,
    patterns: Array<{ amount: number; frequency: number; type: 'income' | 'expense' }>
  ) => {
    let adjustment = 0

    patterns.forEach(pattern => {
      if (day % pattern.frequency === 0) {
        adjustment += pattern.type === 'income' ? pattern.amount : -pattern.amount
      }
    })

    return adjustment / 30
  }

  const generateSimpleProjection = (
    currentBalance: number,
    monthlyRevenue: number,
    monthlyExpenses: number
  ) => {
    const dailyNet = (monthlyRevenue - monthlyExpenses) / 30
    const projection: CashFlowProjection[] = []
    let balance = currentBalance

    for (let day = 0; day <= 120; day++) {
      projection.push({ day, balance: Math.round(balance) })
      balance += dailyNet
    }

    return projection
  }

  const generateCashFlowProjection = async (
    currentBalance: number,
    monthlyRevenue: number,
    monthlyExpenses: number,
    allTransactions: Transaction[]
  ) => {
    try {
      // Filter for last 6 months only
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const transactions = allTransactions.filter(t => {
        if (!t.date) return false
        const date = new Date(t.date)
        return date >= sixMonthsAgo
      })

      // If insufficient historical data, use simple projection
      if (transactions.length < 10) {
        return generateSimpleProjection(currentBalance, monthlyRevenue, monthlyExpenses)
      }

      // Calculate average monthly revenue and expenses from historical data
      const now = new Date()
      const monthsWithData = new Map<string, { revenue: number; expenses: number }>()

      transactions.forEach(t => {
        if (!t.date) return
        const d = new Date(t.date)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        const entry = monthsWithData.get(key) || { revenue: 0, expenses: 0 }
        if (t.type === 'income') entry.revenue += t.amount
        else entry.expenses += t.amount
        monthsWithData.set(key, entry)
      })

      const monthEntries = Array.from(monthsWithData.values())
      const numMonths = Math.max(monthEntries.length, 1)

      // Use historical averages, but weight current month more if it has data
      const avgRevenue = monthEntries.reduce((s, m) => s + m.revenue, 0) / numMonths
      const avgExpenses = monthEntries.reduce((s, m) => s + m.expenses, 0) / numMonths

      // Blend: 60% historical average + 40% current month (more recent = more relevant)
      const blendedRevenue = monthlyRevenue > 0
        ? avgRevenue * 0.6 + monthlyRevenue * 0.4
        : avgRevenue
      const blendedExpenses = monthlyExpenses > 0
        ? avgExpenses * 0.6 + monthlyExpenses * 0.4
        : avgExpenses

      const dailyNet = (blendedRevenue - blendedExpenses) / 30

      // Detect trend direction from recent months (improving or worsening?)
      let trendAdjustment = 0
      if (monthEntries.length >= 2) {
        const recentSavings = monthEntries.slice(-2).map(m => m.revenue - m.expenses)
        const olderSavings = monthEntries.slice(0, -2).map(m => m.revenue - m.expenses)
        const recentAvg = recentSavings.reduce((a, b) => a + b, 0) / recentSavings.length
        const olderAvg = olderSavings.length > 0
          ? olderSavings.reduce((a, b) => a + b, 0) / olderSavings.length
          : recentAvg
        // Subtle trend: if recent months are better/worse, adjust daily by small amount
        trendAdjustment = ((recentAvg - olderAvg) / 30) * 0.1 // 10% weight on trend
      }

      // Generate deterministic projection
      const projection: CashFlowProjection[] = []
      let balance = currentBalance

      for (let day = 0; day <= 120; day++) {
        projection.push({ day, balance: Math.round(balance) })
        balance += dailyNet + trendAdjustment
      }

      return projection
    } catch (error: any) {
      console.error('Error generating projection:', error)
      return generateSimpleProjection(currentBalance, monthlyRevenue, monthlyExpenses)
    }
  }

  const calculateDaysUntilZero = (stats: TransactionStats): number => {
    if (stats.currentBalance <= 0) return 0
    if (stats.monthlySavings >= 0) return 999 // Positive cash flow, won't reach zero

    const dailyBurn = Math.abs(stats.monthlySavings) / 30
    const daysUntilZero = Math.floor(stats.currentBalance / dailyBurn)

    return daysUntilZero
  }

  // Simulation State
  const [simulation, setSimulation] = useState<{
    revenueChange: number;
    expenseChange: number;
    oneTimeExpense: number;
    oneTimeRevenue: number;
  } | null>(null);

  // Apply simulation to stats
  const simulatedStats = useMemo(() => {
    if (!data?.stats || !simulation) return data?.stats;

    const { revenueChange, expenseChange, oneTimeExpense, oneTimeRevenue } = simulation;

    // Apply percentage changes
    const newRevenue = data.stats.totalRevenue * (1 + revenueChange / 100) + oneTimeRevenue;
    const newExpenses = data.stats.totalExpenses * (1 + expenseChange / 100) + oneTimeExpense;
    const newBalance = data.stats.currentBalance + (newRevenue - data.stats.totalRevenue) - (newExpenses - data.stats.totalExpenses);

    return {
      ...data.stats,
      currentBalance: newBalance,
      totalRevenue: newRevenue,
      totalExpenses: newExpenses,
      monthlySavings: newRevenue - newExpenses,
    };
  }, [data?.stats, simulation]);

  // Apply simulation to projection
  const simulatedProjection = useMemo(() => {
    if (!data?.cashFlowProjection || !simulation) return data?.cashFlowProjection;

    // Simple adjustment for visualization: shift the entire curve based on balance change
    // and slope based on monthly savings change
    const balanceDiff = (simulatedStats?.currentBalance || 0) - (data.stats.currentBalance || 0);
    const savingsDiff = (simulatedStats?.monthlySavings || 0) - (data.stats.monthlySavings || 0);
    const dailySavingsDiff = savingsDiff / 30;

    return data.cashFlowProjection.map(day => ({
      day: day.day,
      balance: day.balance + balanceDiff + (dailySavingsDiff * day.day)
    }));
  }, [data?.cashFlowProjection, simulatedStats, simulation]);

  // Recalculate days until zero with simulated values
  const simulatedDaysUntilZero = useMemo(() => {
    if (!simulatedStats) return 0;
    if (simulatedStats.currentBalance <= 0) return 0;
    if (simulatedStats.monthlySavings >= 0) return 999;

    const dailyBurn = Math.abs(simulatedStats.monthlySavings) / 30;
    return Math.floor(simulatedStats.currentBalance / dailyBurn);
  }, [simulatedStats]);

  return {
    stats: simulatedStats || {
      currentBalance: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      monthlySavings: 0,
      monthlyGrowth: 0,
    },
    monthlyData: data?.monthlyData || [],
    cashFlowProjection: simulatedProjection || [],
    daysUntilZero: simulation ? simulatedDaysUntilZero : (data?.daysUntilZero || 0),
    transactions: data?.transactions || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    simulate: setSimulation, // Expose simulation setter
    activeSimulation: simulation // Expose current simulation state
  }
}

