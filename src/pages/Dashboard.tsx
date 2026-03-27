import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, TrendingDown, Calendar, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, Target, Zap, Download, Upload, RefreshCw, Sparkles, ArrowRight, Activity, PieChart, LogOut, User, Settings, Building2, Loader2, Bell } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from "recharts";
import Logo from "@/components/Logo";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionStats } from "@/hooks/useTransactionStats";
import { useTransactions } from "@/hooks/useTransactions";
// import { useAutoSync } from "@/hooks/useAutoSync";
import { useAI } from "@/hooks/useAI";
import { useEffect } from "react";
import { ActionPlan, type ActionItem } from "@/components/ActionPlan";
import { RevenuePrediction } from "@/components/RevenuePrediction";
import { SmartGoals } from "@/components/SmartGoals";
import { CreateGoalModal } from "@/components/CreateGoalModal";
import { ExportReport } from "@/components/ExportReport";
import { AlertsCenter } from "@/components/AlertsCenter";
import { NotificationSettings } from "@/components/NotificationSettings";
import { useSmartGoals } from "@/hooks/useSmartGoals";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { aiService } from "@/services/ai.service";
import { supabase } from "@/lib/supabase";
import type { ExportData } from "@/services/export.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KPISkeleton, ChartSkeleton, TransactionsSkeleton, GoalsSkeleton } from "@/components/DashboardSkeleton";
import { CashFlowChart } from "@/components/CashFlowChart";
import { AIChat } from "@/components/AIChat";
import { FinancialReports } from "@/components/FinancialReports";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [projectionDays, setProjectionDays] = useState<30 | 60 | 120>(30);

  // Fetch real data from Supabase - NOW includes simulation support
  const { stats, monthlyData, cashFlowProjection, daysUntilZero, transactions, loading: statsLoading, simulate, activeSimulation } = useTransactionStats();
  const { transactions: latestTransactions, isLoading: transactionsLoading, deleteTransaction: deleteTransactionHook, createTransaction, isCreating } = useTransactions(user?.id);
  const { goals, refreshGoals } = useSmartGoals();

  // Auto-sync functionality REMOVED for CFO Mode
  // const { syncStatus, manualSync, getLastSyncText } = useAutoSync();

  // AI Features
  const {
    insights,
    balancePrediction,
    spendingPatterns,
    anomalies,
    loading: aiLoading,
    error: aiError,
    isConfigured: isAIConfigured,
    lastAnalysisDate,
    runFullAnalysis,
    loadLatestAnalysisFromDB,
  } = useAI();

  // Show toast when auto-sync starts and completes
  /*
  useEffect(() => {
    // Sync logic removed
  }, []);
  */

  // Fetch user avatar
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching avatar:', error);
          return;
        }

        // If profile doesn't exist, create it
        if (!data) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: user.id, email: user.email }] as any);

          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
          return;
        }

        if ((data as any)?.avatar_url) {
          setUserAvatar((data as any).avatar_url);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchUserAvatar();
  }, [user?.id, user?.email]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  // Estados para controlar modais
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showProjectionModal, setShowProjectionModal] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState(false);
  const [actionPlanItems, setActionPlanItems] = useState<ActionItem[]>([]);

  // Estados para formulários
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Outros");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDescription, setIncomeDescription] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("Receita");

  // Use real data from hooks
  const currentBalance = stats.currentBalance;
  const totalRevenue = stats.totalRevenue;
  const totalExpenses = stats.totalExpenses;
  const monthlyGrowth = stats.monthlyGrowth;
  const monthlySavings = stats.monthlySavings;
  // Filter cash flow data based on selected projection period
  const cashFlowData = cashFlowProjection.filter(item => item.day <= projectionDays);
  const revenueExpensesData = monthlyData;

  // Recent 5 transactions for display
  const recentTransactions = transactions.slice(0, 5);

  const analyzedPeriod = 90;

  // Função para registrar despesa
  const handleAddExpense = () => {
    if (!expenseAmount || !expenseDescription) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Insira um valor positivo",
        variant: "destructive"
      });
      return;
    }

    createTransaction(
      {
        type: 'expense',
        description: expenseDescription,
        amount,
        category: expenseCategory,
        date: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setExpenseAmount("");
          setExpenseDescription("");
          setExpenseCategory("Outros");
          setShowExpenseModal(false);
        },
      }
    );
  };

  // Função para registrar receita
  const handleAddIncome = () => {
    if (!incomeAmount || !incomeDescription) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(incomeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Insira um valor positivo",
        variant: "destructive"
      });
      return;
    }

    createTransaction(
      {
        type: 'income',
        description: incomeDescription,
        amount,
        category: incomeCategory,
        date: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setIncomeAmount("");
          setIncomeDescription("");
          setIncomeCategory("Receita");
          setShowIncomeModal(false);
        },
      }
    );
  };

  // Função para abrir modal de análise (sem rodar nova análise)
  const handleOpenAnalysisModal = () => {
    setShowAIAnalysis(true);
    setAiAnalysisComplete(true);
  };

  // Função para análise de IA com GPT-4o
  const handleAIAnalysis = async () => {
    if (!isAIConfigured) {
      toast({
        title: "API Key do OpenAI necessária",
        description: "Configure a API key do OpenAI no arquivo .env.local",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setShowAIAnalysis(true);
    setAiAnalysisComplete(false);

    try {
      // Executa análise completa com GPT-4o
      await runFullAnalysis();

      setIsAnalyzing(false);
      setAiAnalysisComplete(true);

      toast({
        title: "Análise concluída!",
        description: "Insights de IA gerados com sucesso",
      });
    } catch (error: any) {
      console.error('Error running AI analysis:', error);
      setIsAnalyzing(false);
      setAiAnalysisComplete(false);

      toast({
        title: "Erro na análise",
        description: error.message || "Não foi possível gerar insights",
        variant: "destructive"
      });
    }
  };

  // Função para nova projeção
  const handleNewProjection = () => {
    setShowProjectionModal(true);

    // Simula cálculo de nova projeção
    setTimeout(() => {
      setShowProjectionModal(false);
      toast({
        title: "Nova projeção calculada!",
        description: "Os gráficos foram atualizados com as novas previsões",
      });
    }, 2500);
  };

  // Função para gerar plano de ação com IA
  const handleGenerateActionPlan = async (): Promise<ActionItem[]> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!isAIConfigured) {
      toast({
        title: "API Key do OpenAI necessária",
        description: "Configure a API key do OpenAI no arquivo .env.local",
        variant: "destructive"
      });
      throw new Error('OpenAI not configured');
    }

    try {
      const monthlyBurn = Math.abs(stats.monthlySavings);
      const actions = await aiService.generateActionPlan(
        user.id,
        daysUntilZero,
        currentBalance,
        monthlyBurn
      );

      setActionPlanItems(actions);

      toast({
        title: "Plano de Ação gerado!",
        description: `${actions.length} ações recomendadas`,
      });

      return actions;
    } catch (error: any) {
      toast({
        title: "Erro ao gerar plano",
        description: error.message || "Não foi possível gerar o plano de ação",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Map AI insight severity to card type
  const getInsightType = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'info';
    }
  };

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'spending':
        return TrendingDown;
      case 'income':
        return TrendingUp;
      case 'balance':
        return DollarSign;
      case 'savings':
        return Target;
      case 'risk':
        return AlertTriangle;
      case 'opportunity':
        return Sparkles;
      default:
        return Activity;
    }
  };

  // Preparar dados para exportação
  const prepareExportData = (): ExportData => {
    // Formatar transações para exportação
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      description: t.description,
      type: t.type as 'income' | 'expense',
      date: t.date,
    }));

    // Formatar metas para exportação
    const formattedGoals = goals.map(g => ({
      title: g.title,
      progress: g.progress_percentage || 0,
      target: g.target_amount,
      current: g.current_amount,
    }));

    // Formatar insights de IA
    const formattedInsights = insights.length > 0 ? {
      summary: (insights[0] as any)?.summary || insights[0]?.description || 'Análise financeira realizada com sucesso.',
      warnings: insights
        .filter(i => i.severity === 'high' || i.severity === 'medium')
        .map(i => `${i.title}: ${i.description}`),
      recommendations: insights
        .filter(i => i.severity === 'low' || i.category === 'opportunity')
        .map(i => i.action_items?.join(' | ') || i.description),
    } : undefined;

    // Formatar análises detalhadas de IA
    const formattedAIAnalysis = (balancePrediction || anomalies.length > 0 || spendingPatterns.length > 0) ? {
      balancePrediction: balancePrediction ? {
        predicted_balance: balancePrediction.predicted_balance,
        confidence: balancePrediction.confidence,
        days_ahead: balancePrediction.days_ahead,
        trend: balancePrediction.trend,
      } : undefined,
      anomalies: anomalies.map(a => ({
        description: a.transaction_description,
        amount: a.amount,
        date: a.date,
        reason: a.reason,
        severity: a.severity,
      })),
      spendingPatterns: spendingPatterns.map(p => ({
        category: p.category,
        average_amount: p.average_amount,
        trend: p.trend,
        insights: p.insights,
      })),
    } : undefined;

    // Calcular período (últimos 30 dias)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return {
      currentBalance: currentBalance,
      totalRevenue: totalRevenue,
      totalExpenses: totalExpenses,
      savings: monthlySavings,
      daysUntilZero: daysUntilZero,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      transactions: formattedTransactions,
      goals: formattedGoals.length > 0 ? formattedGoals : undefined,
      insights: formattedInsights,
      aiAnalysis: formattedAIAnalysis,
      userName: user?.email?.split('@')[0] || 'Usuário',
      userEmail: user?.email || '',
    };
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary-glow/5 rounded-full blur-[80px] animate-pulse-glow" style={{ animationDelay: '3s' }} />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]" />
      </div>

      {/* Header com Logout */}
      <header className="relative z-10 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Logo size="md" />
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Vault</h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* Period indicator - hide on mobile */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Últimos {analyzedPeriod} dias</span>
              </div>

              {/* Last Sync Indicator - icon only on mobile - REMOVED for CFO Mode */}
              {/* 
              {syncStatus?.lastSyncAt && (
                <div className="flex items-center gap-2 px-2 md:px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
                  <RefreshCw className={`w-4 h-4 text-primary ${syncStatus?.isSyncing ? 'animate-spin' : ''}`} />
                  <span className="text-sm text-primary hidden md:inline">
                    Sync: {getLastSyncText()}
                  </span>
                </div>
              )}
               */}

              {/* Bank Connection Button - icon only on mobile - REMOVED for CFO Mode */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/import')}
                className="flex items-center gap-2 px-2 md:px-4"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden md:inline">Importar</span>
              </Button>

              {/* Alerts Center */}
              <AlertsCenter />

              {/* User Menu - always show profile circle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-muted/50 px-2 md:px-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 overflow-hidden">
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium hidden md:block">{user?.email?.split('@')[0] || 'Usuário'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowNotifications(true)}
                    className="flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notificações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Design Premium Aprimorado */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* KPIs Premium - Grid com glassmorphism e gradientes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Show skeletons only if loading AND no cached data */}
            {statsLoading && currentBalance === 0 && totalRevenue === 0 && totalExpenses === 0 && (
              <>
                <KPISkeleton />
                <KPISkeleton />
                <KPISkeleton />
                <KPISkeleton />
                <KPISkeleton />
              </>
            )}
            {(!statsLoading || currentBalance !== 0 || totalRevenue !== 0 || totalExpenses !== 0) && (
              <>
                {/* Saldo Atual - Design Premium */}
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saldo Atual</CardTitle>
                        <div className="text-3xl font-bold text-foreground">
                          R$ {currentBalance.toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Receita Mensal - Design Premium */}
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-success/10 via-card/90 to-card/70 backdrop-blur-xl shadow-2xl hover:shadow-success/20 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receita Mensal</CardTitle>
                        <div className="text-3xl font-bold text-success">
                          R$ {totalRevenue.toLocaleString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-success font-medium">
                          <ArrowUpRight className="w-3 h-3" />
                          +{monthlyGrowth}% vs mês anterior
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-success" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Despesas Mensais - Design Premium */}
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-warning/10 via-card/90 to-card/70 backdrop-blur-xl shadow-2xl hover:shadow-warning/20 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Despesas Mensais</CardTitle>
                        <div className="text-3xl font-bold text-warning">
                          R$ {totalExpenses.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          {((totalExpenses / totalRevenue) * 100).toFixed(0)}% da receita
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center">
                        <TrendingDown className="w-6 h-6 text-warning" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Economia - Design Premium */}
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-card/90 to-card/70 backdrop-blur-xl shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Economia</CardTitle>
                        <div className="text-3xl font-bold text-primary">
                          R$ {monthlySavings.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          Este mês
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Alerta de Caixa - Design Premium */}
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-destructive/10 via-card/90 to-card/70 backdrop-blur-xl shadow-2xl hover:shadow-destructive/20 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alerta de Caixa</CardTitle>
                        <div className="text-3xl font-bold text-destructive">
                          {daysUntilZero} dias
                        </div>
                        <div className="text-xs text-destructive font-medium">
                          Até zerar
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center animate-pulse">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Impostos - VAULT TAX */}
                <Card
                  className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-card/90 to-card/70 backdrop-blur-xl shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                  onClick={() => navigate('/dashboard/taxes')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impostos</CardTitle>
                        <div className="text-2xl font-bold text-blue-600">
                          VAULT TAX
                        </div>
                        <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                          Calcular impostos
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
                        <PieChart className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </>
            )}
          </div>

          {/* Ações Rápidas - Destaque no topo */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <button
              onClick={() => setShowExpenseModal(true)}
              className="group flex flex-col items-center gap-2 rounded-xl border-2 border-border/60 bg-card/50 p-4 backdrop-blur-sm transition-all hover:border-destructive/50 hover:bg-destructive/5 hover:shadow-lg sm:p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 transition-colors group-hover:bg-destructive/20">
                <Download className="h-6 w-6 text-destructive" />
              </div>
              <span className="text-xs font-semibold sm:text-sm">Registrar Despesa</span>
            </button>

            <button
              onClick={() => setShowIncomeModal(true)}
              className="group flex flex-col items-center gap-2 rounded-xl border-2 border-border/60 bg-card/50 p-4 backdrop-blur-sm transition-all hover:border-success/50 hover:bg-success/5 hover:shadow-lg sm:p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 transition-colors group-hover:bg-success/20">
                <Upload className="h-6 w-6 text-success" />
              </div>
              <span className="text-xs font-semibold sm:text-sm">Registrar Receita</span>
            </button>

            <button
              onClick={handleNewProjection}
              className="group flex flex-col items-center gap-2 rounded-xl border-2 border-border/60 bg-card/50 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg sm:p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-semibold sm:text-sm">Nova Projeção</span>
            </button>

            <button
              onClick={insights.length > 0 || balancePrediction || anomalies.length > 0 ? handleOpenAnalysisModal : handleAIAnalysis}
              disabled={aiLoading}
              className="group flex flex-col items-center gap-2 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 backdrop-blur-sm transition-all hover:border-primary/60 hover:shadow-lg disabled:opacity-50 sm:p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 transition-colors group-hover:bg-primary/30">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-semibold sm:text-sm">
                {insights.length > 0 || balancePrediction || anomalies.length > 0 ? 'Ver Análise IA' : 'Análise IA'}
              </span>
            </button>
          </div>

          {/* Action Plan for Critical Cash Flow */}
          {daysUntilZero < 15 && daysUntilZero > 0 && (
            <ActionPlan
              daysUntilZero={daysUntilZero}
              currentBalance={currentBalance}
              monthlyBurn={Math.abs(stats.monthlySavings)}
              onGenerateAIPlan={handleGenerateActionPlan}
              initialActions={actionPlanItems}
            />
          )}

          {/* Revenue Prediction - Recurring Revenue & Alerts */}
          <RevenuePrediction
            onSendReminder={(clientName, amount) => {
              toast({
                title: "Lembrete de cobrança",
                description: `Lembrete para ${clientName} (R$ ${amount.toLocaleString('pt-BR')}) será enviado`,
              });
            }}
          />

          {/* Seção de Gráficos Premium */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Projeção - Design Premium */}
            {statsLoading && cashFlowProjection.length === 0 && (
              <div className="lg:col-span-2">
                <ChartSkeleton />
              </div>
            )}
            {(!statsLoading || cashFlowProjection.length > 0) && (
              <Card className="lg:col-span-2 border-0 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl shadow-2xl">
                <CardHeader className="pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground">Projeção de Caixa</CardTitle>
                        <CardDescription className="text-xs">Análise preditiva de {projectionDays} dias</CardDescription>
                      </div>
                    </div>
                  </div>
                  {/* Period Selection Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant={projectionDays === 30 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProjectionDays(30)}
                      className="flex-1 text-xs"
                    >
                      30 dias
                    </Button>
                    <Button
                      variant={projectionDays === 60 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProjectionDays(60)}
                      className="flex-1 text-xs"
                    >
                      60 dias
                    </Button>
                    <Button
                      variant={projectionDays === 120 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProjectionDays(120)}
                      className="flex-1 text-xs"
                    >
                      120 dias
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={cashFlowData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="colorBalanceDashboard" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <filter id="glowDashboard" height="200%" width="200%" x="-50%" y="-50%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          opacity={0.1}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="day"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          interval={projectionDays === 30 ? 4 : projectionDays === 60 ? 9 : 14}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          dx={-5}
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                            return value.toString();
                          }}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="p-3 rounded-xl bg-popover/80 backdrop-blur-md border border-border/50 shadow-xl ring-1 ring-white/10">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Dia {label}</p>
                                  <p className="text-sm font-bold text-foreground">
                                    {Number(payload[0].value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </p>
                                  <p className="text-[10px] text-primary mt-0.5 font-medium">Saldo Projetado</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine
                          y={0}
                          stroke="hsl(var(--destructive))"
                          strokeDasharray="5 5"
                          strokeWidth={1}
                          label={{ value: 'Zero', position: 'right', fill: 'hsl(var(--destructive))', fontSize: 10 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="balance"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          fill="url(#colorBalanceDashboard)"
                          filter="url(#glowDashboard)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Alerta Premium */}
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-destructive/10 to-warning/10 border border-destructive/30 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-destructive mb-1">
                          Atenção: Fluxo de caixa em risco
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Com o padrão atual de receitas e despesas, seu saldo zerrará em <span className="font-bold text-destructive">{daysUntilZero} dias</span>. Recomendamos antecipar recebíveis ou reduzir despesas variáveis.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AIChat - Substitui Insights IA */}
            <div className="h-full">
              <AIChat />
            </div>
          </div>





          {/* Receitas vs Despesas + Transações - Design Premium */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Barras - Design Premium */}
            <Card className="lg:col-span-2 border-0 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-warning/20 flex items-center justify-center">
                      <PieChart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">Receitas vs Despesas</CardTitle>
                      <CardDescription className="text-xs">Comparativo dos últimos 6 meses</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueExpensesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                        </linearGradient>
                        <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `R$${value / 1000}k`}
                        dx={-5}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="p-3 rounded-xl bg-popover/80 backdrop-blur-md border border-border/50 shadow-xl ring-1 ring-white/10">
                                <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-bold text-foreground">
                                      {Number(payload[0].value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-sm font-bold text-foreground">
                                      {Number(payload[1].value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="receita" fill="url(#colorReceita)" radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1500} />
                      <Bar dataKey="despesas" fill="url(#colorDespesa)" radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1500} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Transações Recentes - Design Premium */}
            <Card className="border-0 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">Transações</CardTitle>
                      <CardDescription className="text-xs">Atividade recente</CardDescription>
                    </div>
                  </div>
                  {/* Sync button removed */}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : latestTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Nenhuma transação ainda</p>
                    <p className="text-xs mt-1">Conecte um banco ou adicione transações manualmente</p>
                  </div>
                ) : (
                  latestTransactions.map((transaction) => {
                    // Format date
                    const txDate = new Date(transaction.date);
                    const now = new Date();
                    const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
                    let dateText = '';
                    if (diffDays === 0) dateText = 'Hoje';
                    else if (diffDays === 1) dateText = 'Ontem';
                    else dateText = `${diffDays} dias atrás`;

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-background/60 transition-all border border-transparent hover:border-primary/20 cursor-pointer group"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transaction.type === 'income'
                          ? 'bg-success/20 group-hover:bg-success/30'
                          : 'bg-destructive/20 group-hover:bg-destructive/30'
                          } transition-colors`}>
                          {transaction.type === 'income' ? (
                            <ArrowUpRight className="w-5 h-5 text-success" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{transaction.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{dateText}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground capitalize">{transaction.category}</span>
                            {(transaction as any).synced_from_bank && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Banco</span>
                            )}
                          </div>
                        </div>
                        <div className={`text-sm font-bold ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                          {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR')}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Relatórios Financeiros (DRE) */}
          <div className="w-full">
            <FinancialReports transactions={transactions || []} />
          </div>

          {/* Metas Financeiras */}
          <SmartGoals
            onCreateGoal={() => setShowCreateGoal(true)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 py-8 mt-20">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            IA Vault — seu copiloto financeiro.
          </p>
        </div>
      </footer>

      {/* Modal de Análise de IA - Design Premium */}
      <Dialog open={showAIAnalysis} onOpenChange={setShowAIAnalysis}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto border-0 bg-gradient-to-br from-card/98 to-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div>Análise Detalhada de IA</div>
                  <DialogDescription className="text-sm mt-1">
                    Insights personalizados baseados em machine learning e análise preditiva
                  </DialogDescription>
                </div>
              </div>
              {/* Botão para atualizar análise */}
              {!isAnalyzing && aiAnalysisComplete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIAnalysis}
                  className="flex items-center gap-2"
                  disabled={aiLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <Sparkles className="w-10 h-10 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="text-xl font-semibold text-foreground">Analisando seus dados...</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Processando padrões, tendências, sazonalidade e oportunidades de otimização financeira
              </p>
            </div>
          ) : aiAnalysisComplete ? (
            <div className="space-y-4 py-6">
              {/* AI Error State */}
              {aiError && (
                <Card className="border-l-4 border-l-destructive bg-destructive/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <span>Erro na Análise</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{aiError}</p>
                  </CardContent>
                </Card>
              )}

              {/* Financial Insights */}
              {insights.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Insights Financeiros
                  </h3>
                  {insights.map((insight, index) => {
                    const insightType = getInsightType(insight.severity);
                    const Icon = getInsightIcon(insight.category);

                    return (
                      <Card key={index} className={`border-l-4 transition-all hover:shadow-lg ${insightType === 'success' ? 'border-l-success bg-success/5 hover:bg-success/10' :
                        insightType === 'warning' ? 'border-l-warning bg-warning/5 hover:bg-warning/10' :
                          insightType === 'danger' ? 'border-l-destructive bg-destructive/5 hover:bg-destructive/10' :
                            'border-l-primary bg-primary/5 hover:bg-primary/10'
                        }`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${insightType === 'success' ? 'bg-success/20' :
                                insightType === 'warning' ? 'bg-warning/20' :
                                  insightType === 'danger' ? 'bg-destructive/20' :
                                    'bg-primary/20'
                                }`}>
                                <Icon className={`w-5 h-5 ${insightType === 'success' ? 'text-success' :
                                  insightType === 'warning' ? 'text-warning' :
                                    insightType === 'danger' ? 'text-destructive' :
                                      'text-primary'
                                  }`} />
                              </div>
                              <span>{insight.title}</span>
                            </div>
                            <Sparkles className="w-4 h-4 text-primary" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-foreground leading-relaxed">{insight.description}</p>
                          {insight.action_items && insight.action_items.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground">Ações recomendadas:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {insight.action_items.map((action, i) => (
                                  <li key={i} className="text-xs text-muted-foreground">{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Balance Prediction */}
              {balancePrediction && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-primary" />
                    Previsão de Saldo
                  </h3>
                  <Card className="border-l-4 border-l-primary bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Saldo previsto em {balancePrediction.days_ahead} dias
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-3xl font-bold text-primary">
                        R$ {balancePrediction.predicted_balance.toLocaleString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Confiança:</span>
                        <Progress value={balancePrediction.confidence * 100} className="h-2 flex-1" />
                        <span className="text-sm font-semibold text-primary">
                          {(balancePrediction.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      {balancePrediction.trend && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Tendência:</strong> {balancePrediction.trend}
                        </p>
                      )}
                      {balancePrediction.factors && balancePrediction.factors.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">Fatores considerados:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {balancePrediction.factors.map((factor, i) => (
                              <li key={i} className="text-xs text-muted-foreground">{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Anomalies */}
              {anomalies.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Anomalias Detectadas
                  </h3>
                  <div className="space-y-3">
                    {anomalies.map((anomaly, index) => (
                      <Card key={index} className="border-l-4 border-l-destructive bg-destructive/5">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>{anomaly.transaction_description}</span>
                            <span className="text-xs font-normal text-muted-foreground">
                              {new Date(anomaly.date).toLocaleDateString('pt-BR')}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-foreground">{anomaly.reason}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Severidade:</span>
                            <span className={`text-xs font-semibold ${anomaly.severity === 'high' ? 'text-destructive' :
                              anomaly.severity === 'medium' ? 'text-warning' :
                                'text-success'
                              }`}>
                              {anomaly.severity === 'high' ? 'Alta' : anomaly.severity === 'medium' ? 'Média' : 'Baixa'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Spending Patterns */}
              {spendingPatterns.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-primary" />
                    Padrões de Gastos
                  </h3>
                  <div className="space-y-3">
                    {spendingPatterns.map((pattern, index) => (
                      <Card key={index} className="border-l-4 border-l-primary bg-primary/5">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm capitalize">{pattern.category}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Média Mensal</span>
                            <span className="text-sm font-bold">R$ {pattern.average_amount.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Tendência</span>
                            <span className={`text-sm font-semibold flex items-center gap-1 ${pattern.trend === 'increasing' ? 'text-destructive' :
                              pattern.trend === 'decreasing' ? 'text-success' :
                                'text-muted-foreground'
                              }`}>
                              {pattern.trend === 'increasing' && <ArrowUpRight className="w-3 h-3" />}
                              {pattern.trend === 'decreasing' && <TrendingDown className="w-3 h-3" />}
                              {pattern.trend === 'increasing' ? 'Aumentando' : pattern.trend === 'decreasing' ? 'Diminuindo' : 'Estável'}
                            </span>
                          </div>
                          {pattern.insights && (
                            <p className="text-xs text-muted-foreground mt-2">{pattern.insights}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {insights.length === 0 && !balancePrediction && anomalies.length === 0 && spendingPatterns.length === 0 && !aiError && (
                <Card className="border-l-4 border-l-muted bg-muted/5">
                  <CardContent className="py-8 text-center">
                    <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Não há dados suficientes para gerar insights. Adicione mais transações ou conecte um banco.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Modal de Registrar Despesa - Design Premium */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent className="border-0 bg-gradient-to-br from-card/98 to-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-destructive" />
              </div>
              Registrar Despesa
            </DialogTitle>
            <DialogDescription>
              Adicione uma nova despesa ao seu fluxo de caixa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="expense-amount" className="text-sm font-semibold">Valor (R$)</Label>
              <Input
                id="expense-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                className="h-12 text-base"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-description" className="text-sm font-semibold">Descrição</Label>
              <Input
                id="expense-description"
                placeholder="Ex: Fornecedor, Aluguel, etc"
                className="h-12 text-base"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category" className="text-sm font-semibold">Categoria</Label>
              <select
                id="expense-category"
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
              >
                <option value="Fornecedores">Fornecedores</option>
                <option value="Fixo">Fixo</option>
                <option value="Variável">Variável</option>
                <option value="Salários">Salários</option>
                <option value="Aluguel">Aluguel</option>
                <option value="Serviços">Serviços</option>
                <option value="Marketing">Marketing</option>
                <option value="Impostos">Impostos</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <Button onClick={handleAddExpense} disabled={isCreating} className="w-full h-12 text-base bg-destructive hover:bg-destructive/90 shadow-lg" variant="destructive">
              <Download className="w-5 h-5 mr-2" />
              {isCreating ? 'Registrando...' : 'Registrar Despesa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Registrar Receita - Design Premium */}
      <Dialog open={showIncomeModal} onOpenChange={setShowIncomeModal}>
        <DialogContent className="border-0 bg-gradient-to-br from-card/98 to-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-success" />
              </div>
              Registrar Receita
            </DialogTitle>
            <DialogDescription>
              Adicione uma nova receita ao seu fluxo de caixa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="income-amount" className="text-sm font-semibold">Valor (R$)</Label>
              <Input
                id="income-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                className="h-12 text-base"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-description" className="text-sm font-semibold">Descrição</Label>
              <Input
                id="income-description"
                placeholder="Ex: Venda, Pagamento Cliente, etc"
                className="h-12 text-base"
                value={incomeDescription}
                onChange={(e) => setIncomeDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-category" className="text-sm font-semibold">Categoria</Label>
              <select
                id="income-category"
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={incomeCategory}
                onChange={(e) => setIncomeCategory(e.target.value)}
              >
                <option value="Vendas">Vendas</option>
                <option value="Receita">Receita</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <Button onClick={handleAddIncome} disabled={isCreating} className="w-full h-12 text-base bg-success hover:bg-success/90 shadow-lg">
              <Upload className="w-5 h-5 mr-2" />
              {isCreating ? 'Registrando...' : 'Registrar Receita'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Projeção - Design Premium */}
      <Dialog open={showProjectionModal} onOpenChange={setShowProjectionModal}>
        <DialogContent className="border-0 bg-gradient-to-br from-card/98 to-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              Calculando Nova Projeção
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <Brain className="w-10 h-10 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-xl font-semibold text-foreground">Recalculando projeções...</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Analisando histórico, tendências e sazonalidade para gerar previsões precisas
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criar Meta - Design Premium com IA */}
      <CreateGoalModal
        open={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
        onSuccess={async () => {
          setShowCreateGoal(false);
          // Refresh goals list
          await refreshGoals();
          toast({
            title: "Meta criada com sucesso!",
            description: "Sua meta foi salva e já está sendo monitorada",
          });
        }}
        currentBalance={currentBalance}
        monthlyIncome={totalRevenue}
        monthlyExpenses={totalExpenses}
      />

      {/* Modal de Configurações de Notificações */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-violet-600" />
              Configurações de Notificações
            </DialogTitle>
            <DialogDescription>
              Configure como e quando você deseja receber notificações sobre seu fluxo de caixa
            </DialogDescription>
          </DialogHeader>
          <NotificationSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
