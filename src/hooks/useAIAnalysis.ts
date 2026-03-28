import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface AIAnalysis {
  id: string;
  analysisDate: string;
  status: 'processing' | 'completed' | 'failed';
  currentBalance: number;
  insights?: {
    summary: string;
    warnings: string[];
    recommendations: string[];
  };
  balancePrediction?: {
    predicted_balance: number;
    confidence: number;
    days_ahead: number;
    trend: string;
  };
  anomalies?: Array<{
    description: string;
    amount?: number;
    date: string;
    reason: string;
    severity: string;
  }>;
  spendingPatterns?: Array<{
    category: string;
    average_amount: number;
    trend: string;
    insights?: string;
  }>;
  unreadAlerts: number;
}

export interface AIAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
}

export function useAIAnalysis() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadLatestAnalysis();
    loadAlerts();

    // Subscribe to new analyses
    const analysisChannel = supabase
      .channel('ai-analysis-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_analysis_results',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('[useAIAnalysis] New analysis detected, reloading...');
          loadLatestAnalysis();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_analysis_results',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('[useAIAnalysis] Analysis updated, reloading...');
          loadLatestAnalysis();
        }
      )
      .subscribe();

    // Subscribe to new alerts
    const alertsChannel = supabase
      .channel('ai-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_alerts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('[useAIAnalysis] Alerts changed, reloading...');
          loadAlerts();
        }
      )
      .subscribe();

    return () => {
      analysisChannel.unsubscribe();
      alertsChannel.unsubscribe();
    };
  }, [user, loadLatestAnalysis, loadAlerts]);

  const loadLatestAnalysis = useCallback(async () => {
    if (!user) return;

    try {
      console.log('[useAIAnalysis] Loading latest analysis...');

      const { data, error: rpcError } = await supabase.rpc('get_latest_analysis', {
        p_user_id: user.id,
      });

      if (rpcError) {
        console.error('[useAIAnalysis] Error loading analysis:', rpcError);
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setAnalysis({
          id: result.id,
          analysisDate: result.analysis_date,
          status: result.status,
          currentBalance: result.current_balance,
          insights: result.insights,
          balancePrediction: result.balance_prediction,
          anomalies: result.anomalies,
          spendingPatterns: result.spending_patterns,
          unreadAlerts: result.unread_alerts || 0,
        });
        console.log('[useAIAnalysis] Loaded analysis:', result.id);
      } else {
        console.log('[useAIAnalysis] No analysis found');
        setAnalysis(null);
      }

      setError(null);
    } catch (err) {
      console.error('[useAIAnalysis] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: alertsError } = await supabase
        .from('ai_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) {
        console.error('[useAIAnalysis] Error loading alerts:', alertsError);
        return;
      }

      setAlerts(
        (data || []).map((alert) => ({
          id: alert.id,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          createdAt: alert.created_at,
          isRead: alert.is_read,
          actionRequired: alert.action_required,
          actionUrl: alert.action_url,
        }))
      );

      console.log(`[useAIAnalysis] Loaded ${data?.length || 0} unread alerts`);
    } catch (err) {
      console.error('[useAIAnalysis] Error loading alerts:', err);
    }
  }, [user]);

  const refreshAnalysis = useCallback(() => {
    setLoading(true);
    loadLatestAnalysis();
    loadAlerts();
  }, [loadLatestAnalysis, loadAlerts]);

  const markAlertAsRead = async (alertId: string) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase.rpc('mark_alert_read', {
        p_alert_id: alertId,
        p_user_id: user.id,
      });

      if (updateError) {
        console.error('[useAIAnalysis] Error marking alert as read:', updateError);
        return;
      }

      // Update local state
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));

      // Update unread count
      if (analysis) {
        setAnalysis({
          ...analysis,
          unreadAlerts: Math.max(0, analysis.unreadAlerts - 1),
        });
      }

      console.log('[useAIAnalysis] Alert marked as read:', alertId);
    } catch (err) {
      console.error('[useAIAnalysis] Error:', err);
    }
  };

  const markAllAlertsAsRead = async () => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('ai_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (updateError) {
        console.error('[useAIAnalysis] Error marking all alerts as read:', updateError);
        return;
      }

      // Clear local alerts
      setAlerts([]);

      // Update unread count
      if (analysis) {
        setAnalysis({
          ...analysis,
          unreadAlerts: 0,
        });
      }

      console.log('[useAIAnalysis] All alerts marked as read');
    } catch (err) {
      console.error('[useAIAnalysis] Error:', err);
    }
  };


  return {
    analysis,
    alerts,
    loading,
    error,
    markAlertAsRead,
    markAllAlertsAsRead,
    refreshAnalysis,
  };
}
