// React Hook for AI Features
import { useState, useCallback, useEffect } from 'react'
import { aiService, AIInsight, BalancePrediction, SpendingPattern, AnomalyDetection } from '@/services/ai.service'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

export function useAI() {
  const { user } = useAuth()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [balancePrediction, setBalancePrediction] = useState<BalancePrediction | null>(null)
  const [spendingPatterns, setSpendingPatterns] = useState<SpendingPattern[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAnalysisDate, setLastAnalysisDate] = useState<Date | null>(null)

  // Check if AI is configured
  const isConfigured = aiService.isConfigured()

  // Load latest analysis from database on mount
  useEffect(() => {
    if (user?.id) {
      loadLatestAnalysisFromDB()
    }
  }, [user?.id])

  // Load latest analysis from database
  const loadLatestAnalysisFromDB = useCallback(async () => {
    if (!user?.id) {
      console.log('[useAI] No user ID, skipping load')
      return
    }

    try {
      console.log('[useAI] Loading latest analysis from database for user:', user.id)

      const { data, error: dbError } = await supabase.rpc('get_latest_analysis', {
        p_user_id: user.id
      })

      console.log('[useAI] Database response:', { data, error: dbError })

      if (dbError) {
        console.error('[useAI] Database error:', dbError)
        return
      }

      if (!data || data.length === 0) {
        console.log('[useAI] No previous analysis found in database')
        return
      }

      if (data && data.length > 0) {
        const analysis = data[0]

        // Check if analysis is recent (less than 1 hour old)
        const analysisDate = new Date(analysis.analysis_date)
        const hoursSinceAnalysis = (Date.now() - analysisDate.getTime()) / (1000 * 60 * 60)

        setLastAnalysisDate(analysisDate)

        // Convert database format to hook format
        if (analysis.insights) {
          const dbInsights: AIInsight[] = []

          // Convert warnings to insights
          if (analysis.insights.warnings) {
            analysis.insights.warnings.forEach((warning: string, index: number) => {
              dbInsights.push({
                id: `warning-${index}`,
                title: 'Alerta Financeiro',
                description: warning,
                category: 'risk',
                severity: 'high',
                confidence: 90
              })
            })
          }

          // Convert recommendations to insights
          if (analysis.insights.recommendations) {
            analysis.insights.recommendations.forEach((rec: string, index: number) => {
              dbInsights.push({
                id: `rec-${index}`,
                title: 'Recomendação',
                description: rec,
                category: 'opportunity',
                severity: 'low',
                confidence: 85
              })
            })
          }

          setInsights(dbInsights)
        }

        if (analysis.balance_prediction) {
          setBalancePrediction(analysis.balance_prediction)
        }

        if (analysis.anomalies) {
          setAnomalies(analysis.anomalies)
        }

        if (analysis.spending_patterns) {
          setSpendingPatterns(analysis.spending_patterns)
        }

        console.log(`[useAI] Loaded analysis from ${hoursSinceAnalysis.toFixed(1)}h ago`)

        // If analysis is older than 1 hour, suggest refresh
        if (hoursSinceAnalysis > 1) {
          console.log('[useAI] Analysis is stale, consider running new analysis')
        }
      }
    } catch (err) {
      console.error('[useAI] Error loading from database:', err)
    }
  }, [user?.id])

  // Generate financial insights
  const generateInsights = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('[useAI] Generating insights...')

      const result = await aiService.generateInsights(user.id)
      setInsights(result)

      console.log('[useAI] Generated', result.length, 'insights')
    } catch (err: any) {
      console.error('[useAI] Error generating insights:', err)
      setError(err.message || 'Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }, [user?.id, isConfigured])

  // Predict future balance
  const predictBalance = useCallback(async (daysAhead: number = 30) => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log(`[useAI] Predicting balance for ${daysAhead} days...`)

      const result = await aiService.predictBalance(user.id, daysAhead)
      setBalancePrediction(result)

      console.log('[useAI] Balance prediction:', result)
    } catch (err: any) {
      console.error('[useAI] Error predicting balance:', err)
      setError(err.message || 'Failed to predict balance')
    } finally {
      setLoading(false)
    }
  }, [user?.id, isConfigured])

  // Detect spending anomalies
  const detectAnomalies = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('[useAI] Detecting anomalies...')

      const result = await aiService.detectAnomalies(user.id)
      setAnomalies(result)

      console.log('[useAI] Detected', result.length, 'anomalies')
    } catch (err: any) {
      console.error('[useAI] Error detecting anomalies:', err)
      setError(err.message || 'Failed to detect anomalies')
    } finally {
      setLoading(false)
    }
  }, [user?.id, isConfigured])

  // Analyze spending patterns
  const analyzeSpendingPatterns = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('[useAI] Analyzing spending patterns...')

      const result = await aiService.analyzeSpendingPatterns(user.id)
      setSpendingPatterns(result)

      console.log('[useAI] Analyzed', result.length, 'patterns')
    } catch (err: any) {
      console.error('[useAI] Error analyzing patterns:', err)
      setError(err.message || 'Failed to analyze spending patterns')
    } finally {
      setLoading(false)
    }
  }, [user?.id, isConfigured])

  // Run full AI analysis (all features)
  const runFullAnalysis = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('[useAI] Running full AI analysis...')

      // Get financial data first
      const financialData = await aiService.getUserFinancialData(user.id)

      // Run all analyses in parallel
      const [insightsResult, balanceResult, anomaliesResult, patternsResult] = await Promise.all([
        aiService.generateInsights(user.id),
        aiService.predictBalance(user.id, 30),
        aiService.detectAnomalies(user.id),
        aiService.analyzeSpendingPatterns(user.id)
      ])

      setInsights(insightsResult)
      setBalancePrediction(balanceResult)
      setAnomalies(anomaliesResult)
      setSpendingPatterns(patternsResult)

      console.log('[useAI] Full analysis complete')

      // Save to database (fire-and-forget)
      const totalRevenue = financialData.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalExpenses = financialData.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      const currentBalance = totalRevenue - totalExpenses
      const avgDailyExpense = totalExpenses / 90
      const daysUntilZero = avgDailyExpense > 0 ? Math.floor(currentBalance / avgDailyExpense) : -1

      console.log('[useAI] Saving analysis to database...')

      aiService.saveAnalysisToDatabase(user.id, {
        insights: insightsResult,
        balancePrediction: balanceResult,
        anomalies: anomaliesResult,
        spendingPatterns: patternsResult,
        currentBalance,
        totalRevenue,
        totalExpenses,
        daysUntilZero,
        transactionCount: financialData.transactions.length
      })
        .then(result => {
          console.log('[useAI] ✅ Analysis saved to database successfully!', result)
          setLastAnalysisDate(new Date())
        })
        .catch(err => {
          console.error('[useAI] ❌ Failed to save to database:', err)
        })

    } catch (err: any) {
      console.error('[useAI] Error in full analysis:', err)
      setError(err.message || 'Failed to run full analysis')
    } finally {
      setLoading(false)
    }
  }, [user?.id, isConfigured])

  return {
    // State
    insights,
    balancePrediction,
    spendingPatterns,
    anomalies,
    loading,
    error,
    isConfigured,
    lastAnalysisDate,

    // Actions
    generateInsights,
    predictBalance,
    detectAnomalies,
    analyzeSpendingPatterns,
    runFullAnalysis,
    loadLatestAnalysisFromDB,
  }
}
