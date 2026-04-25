import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Brain, TrendingDown, Calendar, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight,
  DollarSign, Target, Zap, Download, Upload, RefreshCw, Sparkles, ArrowRight, Activity,
  PieChart, LogOut, User, Settings, Loader2, Bell, Menu, FileText, BarChart3, MessageSquare
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from "recharts";
import Logo from "@/components/Logo";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionStats } from "@/hooks/useTransactionStats";
import { useTransactions } from "@/hooks/useTransactions";
import { useAI } from "@/hooks/useAI";
import { ActionPlan, type ActionItem } from "@/components/ActionPlan";
import { SmartGoals } from "@/components/SmartGoals";
import { CreateGoalModal } from "@/components/CreateGoalModal";
import { ExportReport } from "@/components/ExportReport";
import { AlertsCenter } from "@/components/AlertsCenter";
import { useSmartGoals } from "@/hooks/useSmartGoals";
import { aiService } from "@/services/ai.service";
import { supabase } from "@/lib/supabase";
import type { ExportData } from "@/services/export.service";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AIChat } from "@/components/AIChat";
import { FinancialReports } from "@/components/FinancialReports";
import { RevenuePrediction } from "@/components/RevenuePrediction";
import {
  BarChart, Bar
} from "recharts";

// ─── Sidebar Menu Item ───
const MenuItem = ({ icon: Icon, label, onClick, active, badge }: {
  icon: any; label: string; onClick: () => void; active?: boolean; badge?: string
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`}
  >
    <Icon className="h-4 w-4 shrink-0" />
    <span className="flex-1 text-left">{label}</span>
    {badge && (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{badge}</span>
    )}
  </button>
);

// ─── Section type ───
type Section = 'dashboard' | 'transactions' | 'reports' | 'taxes' | 'goals' | 'ai' | 'ai-chat';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [projectionDays, setProjectionDays] = useState<30 | 60 | 120>(30);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  const { stats, monthlyData, cashFlowProjection, daysUntilZero, transactions, loading: statsLoading } = useTransactionStats();
  const { transactions: latestTransactions, isLoading: transactionsLoading, deleteTransaction: deleteTransactionHook, createTransaction, isCreating } = useTransactions(user?.id);
  const { goals, refreshGoals } = useSmartGoals();

  const {
    insights, balancePrediction, spendingPatterns, anomalies,
    loading: aiLoading, error: aiError, isConfigured: isAIConfigured,
    runFullAnalysis,
  } = useAI();

  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle();
        if ((data as any)?.avatar_url) setUserAvatar((data as any).avatar_url);
      } catch {}
    };
    fetchUserAvatar();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast({ title: "Erro ao sair", description: "Tente novamente", variant: "destructive" });
    }
  };

  // ─── Modal states ───
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState(false);
  const [actionPlanItems, setActionPlanItems] = useState<ActionItem[]>([]);

  // ─── Form states ───
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Outros");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDescription, setIncomeDescription] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("Receita");

  // ─── Derived data ───
  const currentBalance = stats.currentBalance;
  const totalRevenue = stats.totalRevenue;
  const totalExpenses = stats.totalExpenses;
  const monthlyGrowth = stats.monthlyGrowth;
  const monthlySavings = stats.monthlySavings;
  const cashFlowData = cashFlowProjection.filter(item => item.day <= projectionDays);
  const revenueExpensesData = monthlyData;

  // ─── Handlers ───
  const handleAddExpense = () => {
    if (!expenseAmount || !expenseDescription) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    createTransaction(
      { type: 'expense', description: expenseDescription, amount, category: expenseCategory, date: new Date().toISOString() },
      { onSuccess: () => { setExpenseAmount(""); setExpenseDescription(""); setExpenseCategory("Outros"); setShowExpenseModal(false); } }
    );
  };

  const handleAddIncome = () => {
    if (!incomeAmount || !incomeDescription) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    const amount = parseFloat(incomeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    createTransaction(
      { type: 'income', description: incomeDescription, amount, category: incomeCategory, date: new Date().toISOString() },
      { onSuccess: () => { setIncomeAmount(""); setIncomeDescription(""); setIncomeCategory("Receita"); setShowIncomeModal(false); } }
    );
  };

  const handleAIAnalysis = async () => {
    if (!isAIConfigured) {
      toast({ title: "API Key necessária", description: "Configure a API key do OpenAI", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true); setShowAIAnalysis(true); setAiAnalysisComplete(false);
    try {
      await runFullAnalysis();
      setIsAnalyzing(false); setAiAnalysisComplete(true);
      toast({ title: "Análise concluída!", description: "Insights de IA gerados com sucesso" });
    } catch (error: any) {
      setIsAnalyzing(false); setAiAnalysisComplete(false);
      toast({ title: "Erro na análise", description: error.message, variant: "destructive" });
    }
  };

  const handleGenerateActionPlan = async (): Promise<ActionItem[]> => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    const monthlyBurn = Math.abs(stats.monthlySavings);
    const actions = await aiService.generateActionPlan(user.id, daysUntilZero, currentBalance, monthlyBurn);
    setActionPlanItems(actions);
    toast({ title: "Plano de Ação gerado!", description: `${actions.length} ações recomendadas` });
    return actions;
  };

  const getInsightType = (severity: string) => {
    switch (severity) { case 'high': return 'danger'; case 'medium': return 'warning'; case 'low': return 'success'; default: return 'info'; }
  };
  const getInsightIcon = (category: string) => {
    switch (category) { case 'spending': return TrendingDown; case 'income': return TrendingUp; case 'balance': return DollarSign; case 'savings': return Target; case 'risk': return AlertTriangle; case 'opportunity': return Sparkles; default: return Activity; }
  };

  const prepareExportData = (): ExportData => {
    const formattedTransactions = transactions.map(t => ({ id: t.id, amount: t.amount, description: t.description, type: t.type as 'income' | 'expense', category: t.category || 'Outros', date: t.date }));
    const formattedGoals = goals.map(g => ({ title: g.title, progress: g.progress_percentage || 0, target: g.target_amount, current: g.current_amount }));
    const formattedInsights = insights.length > 0 ? {
      summary: (insights[0] as any)?.summary || insights[0]?.description || 'Análise financeira realizada.',
      warnings: insights.filter(i => i.severity === 'high' || i.severity === 'medium').map(i => `${i.title}: ${i.description}`),
      recommendations: insights.filter(i => i.severity === 'low' || i.category === 'opportunity').map(i => i.action_items?.join(' | ') || i.description),
    } : undefined;
    const formattedAIAnalysis = (balancePrediction || anomalies.length > 0 || spendingPatterns.length > 0) ? {
      balancePrediction: balancePrediction ? { predicted_balance: balancePrediction.predicted_balance, confidence: balancePrediction.confidence, days_ahead: balancePrediction.days_ahead, trend: balancePrediction.trend } : undefined,
      anomalies: anomalies.map(a => ({ description: a.transaction_description, amount: a.amount, date: a.date, reason: a.reason, severity: a.severity })),
      spendingPatterns: spendingPatterns.map(p => ({ category: p.category, average_amount: p.average_amount, trend: p.trend, insights: p.insights })),
    } : undefined;
    const endDate = new Date(); const startDate = new Date(); startDate.setDate(startDate.getDate() - 30);
    return {
      currentBalance, totalRevenue, totalExpenses, savings: monthlySavings, daysUntilZero,
      periodStart: startDate.toISOString(), periodEnd: endDate.toISOString(),
      transactions: formattedTransactions, goals: formattedGoals.length > 0 ? formattedGoals : undefined,
      insights: formattedInsights, aiAnalysis: formattedAIAnalysis,
      userName: user?.email?.split('@')[0] || 'Usuário', userEmail: user?.email || '',
    };
  };

  const goToSection = (section: Section) => {
    if (section === 'taxes') { navigate('/dashboard/taxes'); setSidebarOpen(false); return; }
    setActiveSection(section);
    setSidebarOpen(false);
  };

  // ─── RENDER ───
  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Logo size="sm" />
            <span className="text-lg font-bold">Vault</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/import')} className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <AlertsCenter />
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Sidebar (Sheet) ─── */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="text-left">
                <SheetTitle className="text-sm">{user?.email?.split('@')[0] || 'Usuário'}</SheetTitle>
                <SheetDescription className="text-xs">{user?.email}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100%-5rem)] min-h-0">
            <nav className="space-y-1 p-3 flex-1 overflow-y-auto min-h-0">
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Principal</p>
              <MenuItem icon={Activity} label="Dashboard" active={activeSection === 'dashboard'} onClick={() => goToSection('dashboard')} />
              <MenuItem icon={Upload} label="Importar Extrato" onClick={() => { navigate('/import'); setSidebarOpen(false); }} />

              <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Financeiro</p>
              <MenuItem icon={ArrowDownRight} label="Transações" active={activeSection === 'transactions'} onClick={() => goToSection('transactions')} />
              <MenuItem icon={BarChart3} label="Relatórios / DRE" active={activeSection === 'reports'} onClick={() => goToSection('reports')} />
              <MenuItem icon={PieChart} label="Impostos (Vault Tax)" onClick={() => goToSection('taxes')} />
              <MenuItem icon={Target} label="Metas" active={activeSection === 'goals'} onClick={() => goToSection('goals')} />

              <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Inteligência</p>
              <MenuItem icon={Brain} label="Análise IA" active={activeSection === 'ai'} onClick={() => goToSection('ai')} />
              <MenuItem icon={MessageSquare} label="Chat IA" active={activeSection === 'ai-chat'} onClick={() => goToSection('ai-chat')} />

              <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conta</p>
              <MenuItem icon={User} label="Perfil" onClick={() => { navigate('/profile'); setSidebarOpen(false); }} />
              <MenuItem icon={Settings} label="Configurações" onClick={() => { setSidebarOpen(false); }} />
            </nav>

            <div className="border-t p-3 shrink-0">
              <MenuItem icon={LogOut} label="Sair" onClick={() => { handleLogout(); setSidebarOpen(false); }} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Main Content ─── */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ════════ DASHBOARD (default) ════════ */}
          {activeSection === 'dashboard' && (
            <>
              {/* ─── Hero: Saúde do Caixa ─── */}
              {(() => {
                const monthlyBurn = stats.monthlySavings // negative = burning
                const isPositive = monthlyBurn >= 0
                const burnPerMonth = Math.abs(monthlyBurn)
                const alreadyNegative = currentBalance <= 0 && !isPositive
                const isCritical = alreadyNegative || (!isPositive && daysUntilZero > 0 && daysUntilZero < 15)
                const isWarning = !isCritical && !isPositive && daysUntilZero >= 15 && daysUntilZero < 60
                const isHealthy = !isCritical && !isWarning && (isPositive || daysUntilZero >= 60)

                const statusColor = isCritical
                  ? 'border-red-500/40 bg-red-500/5'
                  : isWarning
                  ? 'border-orange-400/40 bg-orange-400/5'
                  : 'border-green-500/40 bg-green-500/5'

                const dotColor = isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-400' : 'bg-green-500'
                const labelColor = isCritical ? 'text-red-500' : isWarning ? 'text-orange-400' : 'text-green-500'
                const daysColor = isCritical ? 'text-red-500' : isWarning ? 'text-orange-400' : 'text-green-500'

                const statusLabel = isCritical
                  ? (alreadyNegative ? 'Saldo Negativo' : 'Risco Crítico')
                  : isWarning ? 'Atenção Necessária' : 'Caixa Saudável'
                const statusMsg = alreadyNegative
                  ? `Seu saldo já está negativo. ${burnPerMonth > 0 ? `Despesas de R$ ${burnPerMonth.toLocaleString('pt-BR')}/mês agravam a situação.` : 'Registre receitas para equilibrar.'}`
                  : isCritical
                  ? `Seu caixa zera em ${daysUntilZero} dias. Ação imediata necessária.`
                  : isWarning
                  ? `No ritmo atual, você tem ${daysUntilZero} dias de caixa. Revise suas despesas.`
                  : isPositive
                  ? `Receita supera despesas em R$ ${burnPerMonth.toLocaleString('pt-BR')}/mês. Bom trabalho!`
                  : `Caixa estável por mais de 60 dias no ritmo atual.`

                // progress bar: 0% when negative, 0-100% de 0 a 90 dias
                const progressPct = alreadyNegative ? 0 : isPositive ? 100 : Math.min(100, Math.round((daysUntilZero / 90) * 100))

                return (
                  <Card className={`border-2 ${statusColor}`}>
                    <CardContent className="p-4">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor} ${isCritical ? 'animate-pulse' : ''}`} />
                          <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>{statusLabel}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saldo atual</p>
                          <p className="text-lg font-bold tabular-nums">
                            R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Days counter */}
                      <div className="mt-4 flex items-end gap-3">
                        <div>
                          <p className={`text-5xl font-black tabular-nums leading-none ${daysColor}`}>
                            {isPositive ? '∞' : alreadyNegative ? '!' : daysUntilZero}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alreadyNegative ? 'saldo negativo' : 'dias de caixa restantes'}
                          </p>
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="text-xs text-muted-foreground mb-1.5">{statusMsg}</p>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-400' : 'bg-green-500'}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bottom KPIs */}
                      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/50 pt-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Receita</p>
                          <p className="text-sm font-bold text-green-600 mt-0.5 tabular-nums">
                            +R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Despesas</p>
                          <p className="text-sm font-bold text-red-500 mt-0.5 tabular-nums">
                            -R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Burn/mês</p>
                          <p className={`text-sm font-bold mt-0.5 tabular-nums ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                            {isPositive ? '+' : '-'}R$ {burnPerMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1.5 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                  onClick={() => setShowExpenseModal(true)}
                >
                  <Download className="h-5 w-5 text-red-500" />
                  <span className="text-xs font-medium">Registrar Despesa</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1.5 border-green-200 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-950"
                  onClick={() => setShowIncomeModal(true)}
                >
                  <Upload className="h-5 w-5 text-green-500" />
                  <span className="text-xs font-medium">Registrar Receita</span>
                </Button>
              </div>

              {/* Action Plan (ativa a partir de 30 dias) */}
              {!statsLoading && daysUntilZero > 0 && daysUntilZero < 30 && (
                <ActionPlan
                  daysUntilZero={daysUntilZero}
                  currentBalance={currentBalance}
                  monthlyBurn={Math.abs(stats.monthlySavings)}
                  onGenerateAIPlan={handleGenerateActionPlan}
                  initialActions={actionPlanItems}
                />
              )}

              {/* ─── Main Chart ─── */}
              {(() => {
                const isNegativeBalance = currentBalance < 0
                const monthlyExpenseTotal = totalExpenses || Math.abs(stats.monthlySavings)
                const neededRevenue = isNegativeBalance
                  ? monthlyExpenseTotal + Math.abs(currentBalance) / 6 // recover in 6 months
                  : monthlyExpenseTotal - totalRevenue > 0 ? monthlyExpenseTotal : 0
                const breakEvenRevenue = monthlyExpenseTotal // just to cover expenses

                // Build recovery scenario data
                const recoveryData = cashFlowData.map(d => {
                  const dailyRecovery = (neededRevenue - monthlyExpenseTotal) / 30
                  return {
                    ...d,
                    recovery: Math.round(currentBalance + dailyRecovery * d.day),
                  }
                })

                return (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-bold">Projeção de Caixa</CardTitle>
                          <CardDescription className="text-xs">Próximos {projectionDays} dias</CardDescription>
                        </div>
                        <ExportReport data={prepareExportData()} />
                      </div>
                      <div className="flex gap-2 pt-2">
                        {([30, 60, 120] as const).map((d) => (
                          <Button key={d} variant={projectionDays === d ? "default" : "outline"} size="sm" onClick={() => setProjectionDays(d)} className="flex-1 text-xs">
                            {d}d
                          </Button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={recoveryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isNegativeBalance ? "hsl(var(--destructive))" : "hsl(var(--primary))"} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={isNegativeBalance ? "hsl(var(--destructive))" : "hsl(var(--primary))"} stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorRecovery" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} vertical={false} />
                            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={projectionDays === 30 ? 4 : projectionDays === 60 ? 9 : 14} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => {
                              const abs = Math.abs(v)
                              const formatted = abs >= 1000 ? `${(abs / 1000).toFixed(0)}k` : String(abs)
                              return v < 0 ? `-${formatted}` : formatted
                            }} />
                            <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                              <div className="rounded-lg border bg-popover/90 backdrop-blur p-2.5 shadow-lg">
                                <p className="text-xs text-muted-foreground">Dia {label}</p>
                                <p className={`text-sm font-bold ${Number(payload[0].value) < 0 ? 'text-destructive' : ''}`}>
                                  {Number(payload[0].value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                                {payload[1]?.value != null && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Cenário com receita: {Number(payload[1].value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </p>
                                )}
                              </div>
                            ) : null} />
                            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="8 4" strokeWidth={1.5} label={{ value: 'Equilíbrio', position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                            {isNegativeBalance && neededRevenue > 0 && (
                              <Area type="monotone" dataKey="recovery" stroke="hsl(142 76% 36%)" strokeWidth={1.5} strokeDasharray="6 3" fill="url(#colorRecovery)" animationDuration={1000} />
                            )}
                            <Area type="monotone" dataKey="balance" stroke={isNegativeBalance ? "hsl(var(--destructive))" : "hsl(var(--primary))"} strokeWidth={2} fill="url(#colorBalance)" animationDuration={1000} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* ─── Actionable Insights ─── */}
                      <div className="mt-4 space-y-2">
                        {isNegativeBalance && (
                          <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>
                                <span className="font-semibold text-foreground">Linha vermelha:</span> ritmo atual sem receita.{' '}
                                {neededRevenue > 0 && <><span className="font-semibold text-green-600">Linha verde:</span> cenário faturando R$ {neededRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês.</>}
                              </p>
                              <p>
                                Para cobrir despesas: mínimo <span className="font-bold text-foreground">R$ {breakEvenRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês</span>.{' '}
                                Para zerar dívida em 6 meses: <span className="font-bold text-foreground">R$ {neededRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês</span>.
                              </p>
                            </div>
                          </div>
                        )}
                        {!isNegativeBalance && daysUntilZero > 0 && daysUntilZero < 60 && (
                          <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground">
                              Saldo zera em <span className="font-bold text-destructive">{daysUntilZero} dias</span> no ritmo atual. Reduza despesas ou antecipe recebíveis.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}
            </>
          )}

          {/* ════════ TRANSACTIONS ════════ */}
          {activeSection === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Transações Recentes</h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/import')}>
                  <Upload className="h-4 w-4 mr-2" /> Importar
                </Button>
              </div>
              <Card>
                <CardContent className="p-0 divide-y">
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : latestTransactions.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <p className="text-sm">Nenhuma transação ainda</p>
                      <p className="text-xs mt-1">Importe um extrato ou adicione manualmente</p>
                    </div>
                  ) : (
                    latestTransactions.map((t) => {
                      const txDate = new Date(t.date);
                      const diffDays = Math.floor((Date.now() - txDate.getTime()) / 86400000);
                      const dateText = diffDays === 0 ? 'Hoje' : diffDays === 1 ? 'Ontem' : `${diffDays}d atrás`;
                      return (
                        <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            {t.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{t.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{dateText}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t.category}</span>
                            </div>
                          </div>
                          <span className={`text-sm font-bold tabular-nums ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                            {t.type === 'income' ? '+' : '-'}R$ {t.amount.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════ REPORTS / DRE ════════ */}
          {activeSection === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Relatórios Financeiros</h2>
                <ExportReport data={prepareExportData()} />
              </div>

              {/* Bar chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Receitas vs Despesas</CardTitle>
                  <CardDescription className="text-xs">Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueExpensesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} vertical={false} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v / 1000}k`} />
                        <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                          <div className="rounded-lg border bg-popover/90 backdrop-blur p-2.5 shadow-lg">
                            <p className="text-xs text-muted-foreground mb-1">{label}</p>
                            <p className="text-sm font-bold text-green-600">Receita: {Number(payload[0].value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            <p className="text-sm font-bold text-red-500">Despesa: {Number(payload[1].value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          </div>
                        ) : null} />
                        <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <FinancialReports transactions={transactions || []} />
            </div>
          )}

          {/* ════════ GOALS ════════ */}
          {activeSection === 'goals' && (
            <SmartGoals onCreateGoal={() => setShowCreateGoal(true)} />
          )}

          {/* ════════ AI ANALYSIS ════════ */}
          {activeSection === 'ai' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Análise de IA</h2>
                <Button size="sm" onClick={handleAIAnalysis} disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                  {insights.length > 0 ? 'Atualizar' : 'Gerar Análise'}
                </Button>
              </div>

              {insights.length === 0 && !balancePrediction && anomalies.length === 0 ? (
                <Card className="py-12 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">Clique em "Gerar Análise" para insights financeiros com IA</p>
                </Card>
              ) : (
                <>
                  {insights.map((insight, i) => {
                    const t = getInsightType(insight.severity);
                    const Icon = getInsightIcon(insight.category);
                    return (
                      <Card key={i} className={`border-l-4 ${t === 'danger' ? 'border-l-red-500' : t === 'warning' ? 'border-l-orange-500' : t === 'success' ? 'border-l-green-500' : 'border-l-primary'}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {insight.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                          {insight.action_items && insight.action_items.length > 0 && (
                            <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-muted-foreground">
                              {insight.action_items.map((a, j) => <li key={j}>{a}</li>)}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {balancePrediction && (
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Previsão de Saldo ({balancePrediction.days_ahead}d)</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-primary">R$ {balancePrediction.predicted_balance.toLocaleString('pt-BR')}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Confiança:</span>
                          <Progress value={balancePrediction.confidence * 100} className="h-1.5 flex-1" />
                          <span className="text-xs font-semibold">{(balancePrediction.confidence * 100).toFixed(0)}%</span>
                        </div>
                        {balancePrediction.trend && <p className="text-xs text-muted-foreground mt-2">{balancePrediction.trend}</p>}
                      </CardContent>
                    </Card>
                  )}

                  {anomalies.length > 0 && anomalies.map((a, i) => (
                    <Card key={i} className="border-l-4 border-l-red-500">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>{a.transaction_description}</span>
                          <span className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString('pt-BR')}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent><p className="text-sm text-muted-foreground">{a.reason}</p></CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ════════ AI CHAT ════════ */}
          {activeSection === 'ai-chat' && (
            <div className="h-[calc(100vh-8rem)]">
              <AIChat />
            </div>
          )}

        </div>
      </main>

      {/* ─── Modals ─── */}
      {/* Expense Modal */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-red-500" /> Registrar Despesa
            </DialogTitle>
            <DialogDescription>Adicione uma nova despesa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Valor (R$)</Label>
              <Input type="number" min="0.01" step="0.01" placeholder="0,00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Descrição</Label>
              <Input placeholder="Ex: Fornecedor, Aluguel" value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Categoria</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                {['Fornecedores', 'Fixo', 'Variável', 'Salários', 'Aluguel', 'Serviços', 'Marketing', 'Impostos', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Button onClick={handleAddExpense} disabled={isCreating} variant="destructive" className="w-full">
              {isCreating ? 'Registrando...' : 'Registrar Despesa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Income Modal */}
      <Dialog open={showIncomeModal} onOpenChange={setShowIncomeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-500" /> Registrar Receita
            </DialogTitle>
            <DialogDescription>Adicione uma nova receita</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Valor (R$)</Label>
              <Input type="number" min="0.01" step="0.01" placeholder="0,00" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Descrição</Label>
              <Input placeholder="Ex: Venda, Pagamento Cliente" value={incomeDescription} onChange={(e) => setIncomeDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Categoria</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)}>
                {['Vendas', 'Receita', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Button onClick={handleAddIncome} disabled={isCreating} className="w-full bg-green-600 hover:bg-green-700">
              {isCreating ? 'Registrando...' : 'Registrar Receita'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Goal Modal */}
      <CreateGoalModal
        open={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
        onSuccess={async () => { setShowCreateGoal(false); await refreshGoals(); toast({ title: "Meta criada!" }); }}
        currentBalance={currentBalance}
        monthlyIncome={totalRevenue}
        monthlyExpenses={totalExpenses}
      />

    </div>
  );
};

export default Dashboard;
