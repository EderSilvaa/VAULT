// Edge Function: AI Analysis Cron Job
// Runs every hour to analyze user accounts and generate insights

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  date: string;
  category: string;
}

interface AnalysisResult {
  insights: {
    summary: string;
    warnings: string[];
    recommendations: string[];
  };
  balancePrediction: {
    predicted_balance: number;
    confidence: number;
    days_ahead: number;
    trend: string;
  } | null;
  anomalies: Array<{
    description: string;
    amount?: number;
    date: string;
    reason: string;
    severity: string;
  }>;
  spendingPatterns: Array<{
    category: string;
    average_amount: number;
    trend: string;
    insights?: string;
  }>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get users that need analysis
    const { data: schedules, error: scheduleError } = await supabase
      .from('ai_analysis_schedule')
      .select('user_id, frequency_minutes')
      .eq('enabled', true)
      .lte('next_run_at', new Date().toISOString())
      .limit(50); // Process max 50 users per run

    if (scheduleError) {
      throw scheduleError;
    }

    console.log(`Found ${schedules?.length || 0} users to analyze`);

    const results = [];

    // Process each user
    for (const schedule of schedules || []) {
      try {
        const analysisResult = await analyzeUser(supabase, schedule.user_id, openaiKey);
        results.push({
          user_id: schedule.user_id,
          status: 'success',
          analysis_id: analysisResult.id,
        });

        // Schedule next run
        await supabase.rpc('schedule_next_analysis', { p_user_id: schedule.user_id });

        // Update last run status
        await supabase
          .from('ai_analysis_schedule')
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: 'success',
            consecutive_failures: 0,
          })
          .eq('user_id', schedule.user_id);
      } catch (error) {
        console.error(`Error analyzing user ${schedule.user_id}:`, error);

        results.push({
          user_id: schedule.user_id,
          status: 'failed',
          error: error.message,
        });

        // Track failure — supabase.raw() is not supported in JS client v2,
        // so fetch current counter first then increment.
        const { data: currentSchedule } = await supabase
          .from('ai_analysis_schedule')
          .select('consecutive_failures')
          .eq('user_id', schedule.user_id)
          .single();

        await supabase
          .from('ai_analysis_schedule')
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: 'failed',
            last_error: error.message,
            consecutive_failures: (currentSchedule?.consecutive_failures ?? 0) + 1,
          })
          .eq('user_id', schedule.user_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Cron job error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function analyzeUser(
  supabase: any,
  userId: string,
  openaiKey: string
): Promise<{ id: string }> {
  const startTime = Date.now();

  // Create analysis record
  const { data: analysisRecord, error: insertError } = await supabase
    .from('ai_analysis_results')
    .insert({
      user_id: userId,
      status: 'processing',
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  try {
    // Get user's transactions (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', ninetyDaysAgo.toISOString())
      .order('date', { ascending: false });

    if (txError) {
      throw txError;
    }

    if (!transactions || transactions.length === 0) {
      // No transactions, mark as completed but with no insights
      await supabase
        .from('ai_analysis_results')
        .update({
          status: 'completed',
          transaction_count: 0,
          analysis_duration_ms: Date.now() - startTime,
        })
        .eq('id', analysisRecord.id);

      return analysisRecord;
    }

    // Calculate financial snapshot
    const totalRevenue = transactions
      .filter((t: Transaction) => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t: Transaction) => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);

    const currentBalance = totalRevenue - totalExpenses;
    const avgDailyExpenses = totalExpenses / 90;
    const daysUntilZero = avgDailyExpenses > 0 ? Math.floor(currentBalance / avgDailyExpenses) : -1;

    // Run AI analysis
    const analysis = await runAIAnalysis(transactions, openaiKey, {
      currentBalance,
      totalRevenue,
      totalExpenses,
    });

    // Generate alerts for critical issues
    const alerts = generateAlerts(analysis, userId, analysisRecord.id);

    // Save alerts
    if (alerts.length > 0) {
      await supabase.from('ai_alerts').insert(alerts);
    }

    // Update analysis record
    await supabase
      .from('ai_analysis_results')
      .update({
        status: 'completed',
        current_balance: currentBalance,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        days_until_zero: daysUntilZero,
        insights: analysis.insights,
        balance_prediction: analysis.balancePrediction,
        anomalies: analysis.anomalies,
        spending_patterns: analysis.spendingPatterns,
        transaction_count: transactions.length,
        analysis_duration_ms: Date.now() - startTime,
      })
      .eq('id', analysisRecord.id);

    console.log(`Analysis completed for user ${userId} in ${Date.now() - startTime}ms`);

    return analysisRecord;
  } catch (error) {
    // Mark as failed
    await supabase
      .from('ai_analysis_results')
      .update({
        status: 'failed',
        error_message: error.message,
        analysis_duration_ms: Date.now() - startTime,
      })
      .eq('id', analysisRecord.id);

    throw error;
  }
}

async function runAIAnalysis(
  transactions: Transaction[],
  openaiKey: string,
  snapshot: { currentBalance: number; totalRevenue: number; totalExpenses: number }
): Promise<AnalysisResult> {
  // Simplified analysis for now - in production, call OpenAI API
  const insights = {
    summary: `Você teve ${transactions.length} transações nos últimos 90 dias. Saldo atual: R$ ${snapshot.currentBalance.toFixed(2)}.`,
    warnings: [],
    recommendations: [],
  };

  // Detect anomalies
  const anomalies = detectAnomalies(transactions);

  // Analyze spending patterns
  const spendingPatterns = analyzeSpendingPatterns(transactions);

  // Predict balance
  const balancePrediction = predictBalance(transactions, snapshot.currentBalance);

  // Generate warnings
  if (snapshot.currentBalance < 0) {
    insights.warnings.push('Saldo negativo detectado! Suas despesas estão maiores que receitas.');
  }

  if (anomalies.length > 0) {
    insights.warnings.push(`${anomalies.length} transação(ões) anômala(s) detectada(s).`);
  }

  // Generate recommendations
  if (snapshot.totalExpenses > snapshot.totalRevenue * 0.8) {
    insights.recommendations.push('Considere reduzir despesas em 20% para melhorar seu saldo.');
  }

  return {
    insights,
    balancePrediction,
    anomalies,
    spendingPatterns,
  };
}

function detectAnomalies(transactions: Transaction[]) {
  const anomalies = [];

  // Calculate average expense
  const expenses = transactions.filter((t) => t.type === 'expense');
  const avgExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0) / expenses.length;

  // Find outliers (expenses > 3x average)
  for (const tx of expenses) {
    if (Number(tx.amount) > avgExpense * 3) {
      anomalies.push({
        description: `Despesa incomum: ${tx.description}`,
        amount: Number(tx.amount),
        date: tx.date,
        reason: `Valor ${(Number(tx.amount) / avgExpense).toFixed(1)}x maior que a média`,
        severity: Number(tx.amount) > avgExpense * 5 ? 'high' : 'medium',
      });
    }
  }

  return anomalies;
}

function analyzeSpendingPatterns(transactions: Transaction[]) {
  const patterns = [];

  // Group by category
  const byCategory: { [key: string]: number[] } = {};

  for (const tx of transactions.filter((t) => t.type === 'expense')) {
    const category = tx.category || 'Outros';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(Number(tx.amount));
  }

  // Calculate averages and trends
  for (const [category, amounts] of Object.entries(byCategory)) {
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    patterns.push({
      category,
      average_amount: avg,
      trend: 'stable',
      insights: `Média de R$ ${avg.toFixed(2)} em ${category}`,
    });
  }

  return patterns.sort((a, b) => b.average_amount - a.average_amount).slice(0, 5);
}

function predictBalance(transactions: Transaction[], currentBalance: number) {
  // Calculate average daily change
  const expenses = transactions.filter((t) => t.type === 'expense');
  const income = transactions.filter((t) => t.type === 'income');

  const avgDailyExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0) / 90;
  const avgDailyIncome = income.reduce((sum, t) => sum + Number(t.amount), 0) / 90;

  const netDailyChange = avgDailyIncome - avgDailyExpense;
  const predictedBalance = currentBalance + netDailyChange * 30;

  return {
    predicted_balance: predictedBalance,
    confidence: 75,
    days_ahead: 30,
    trend: netDailyChange > 0 ? 'increasing' : netDailyChange < 0 ? 'decreasing' : 'stable',
  };
}

function generateAlerts(analysis: AnalysisResult, userId: string, analysisId: string) {
  const alerts = [];

  // Critical alerts from warnings
  for (const warning of analysis.insights.warnings) {
    alerts.push({
      user_id: userId,
      analysis_id: analysisId,
      type: 'warning',
      title: 'Alerta Financeiro',
      message: warning,
      action_required: true,
    });
  }

  // High severity anomalies
  for (const anomaly of analysis.anomalies.filter((a) => a.severity === 'high')) {
    alerts.push({
      user_id: userId,
      analysis_id: analysisId,
      type: 'critical',
      title: 'Anomalia Detectada',
      message: `${anomaly.description} - ${anomaly.reason}`,
      action_required: true,
    });
  }

  // Balance prediction warnings
  if (analysis.balancePrediction && analysis.balancePrediction.predicted_balance < 0) {
    alerts.push({
      user_id: userId,
      analysis_id: analysisId,
      type: 'critical',
      title: 'Alerta de Saldo',
      message: `Seu saldo pode ficar negativo em 30 dias se continuar neste ritmo de gastos.`,
      action_required: true,
    });
  }

  return alerts;
}
