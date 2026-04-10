import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { posthog } from "@/lib/posthog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ShoppingCart,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import Logo from "@/components/Logo";

const Simulator = () => {
  const navigate = useNavigate();
  const [weeklyRevenue, setWeeklyRevenue] = useState([5000]);
  const [fixedExpenses, setFixedExpenses] = useState([3000]);
  const [variableExpenses, setVariableExpenses] = useState([1500]);

  const balance = weeklyRevenue[0] - fixedExpenses[0] - variableExpenses[0];
  const isPositive = balance > 0;

  const handleSimulate = () => {
    posthog.capture("simulation_completed", {
      weekly_revenue: weeklyRevenue[0],
      fixed_expenses: fixedExpenses[0],
      variable_expenses: variableExpenses[0],
      balance,
      is_positive: isPositive,
    });
    navigate("/results", {
      state: { weeklyRevenue: weeklyRevenue[0], fixedExpenses: fixedExpenses[0], variableExpenses: variableExpenses[0] },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <div className="h-5 w-px bg-border/60" />
            <Logo size="sm" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/login")}
            className="text-sm"
          >
            Já tenho conta
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Simulador gratuito
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Simule seu fluxo de caixa
            </h1>
            <p className="text-muted-foreground mt-2 text-base sm:text-lg max-w-md mx-auto">
              Ajuste os 3 valores abaixo e veja a previsão das próximas 4 semanas
            </p>
          </div>

          {/* Slider cards */}
          <div className="grid gap-4 md:gap-5">
            {/* Weekly Revenue */}
            <Card className="p-5 md:p-6 border border-border/60 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Receita Semanal</h3>
                    <p className="text-xs text-muted-foreground">Quanto você recebe por semana em média</p>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-success tabular-nums">
                  R$ {weeklyRevenue[0].toLocaleString("pt-BR")}
                </div>
              </div>
              <Slider
                value={weeklyRevenue}
                onValueChange={setWeeklyRevenue}
                min={500}
                max={20000}
                step={500}
                className="py-1"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>R$ 500</span>
                <span>R$ 20.000</span>
              </div>
            </Card>

            {/* Fixed Expenses */}
            <Card className="p-5 md:p-6 border border-border/60 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Despesas Fixas</h3>
                    <p className="text-xs text-muted-foreground">Aluguel, salários, contas mensais</p>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-destructive tabular-nums">
                  R$ {fixedExpenses[0].toLocaleString("pt-BR")}
                </div>
              </div>
              <Slider
                value={fixedExpenses}
                onValueChange={setFixedExpenses}
                min={0}
                max={15000}
                step={500}
                className="py-1"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>R$ 0</span>
                <span>R$ 15.000</span>
              </div>
            </Card>

            {/* Variable Expenses */}
            <Card className="p-5 md:p-6 border border-border/60 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Despesas Variáveis</h3>
                    <p className="text-xs text-muted-foreground">Materiais, transporte, outras</p>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-warning tabular-nums">
                  R$ {variableExpenses[0].toLocaleString("pt-BR")}
                </div>
              </div>
              <Slider
                value={variableExpenses}
                onValueChange={setVariableExpenses}
                min={0}
                max={10000}
                step={500}
                className="py-1"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>R$ 0</span>
                <span>R$ 10.000</span>
              </div>
            </Card>
          </div>

          {/* Live balance preview */}
          <div className="mt-6 md:mt-8">
            <Card className={`p-5 md:p-6 border-2 ${isPositive ? "border-success/30 bg-success/[0.03]" : "border-destructive/30 bg-destructive/[0.03]"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? "bg-success/10" : "bg-destructive/10"}`}>
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Saldo semanal estimado</p>
                    <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${isPositive ? "text-success" : "text-destructive"}`}>
                      R$ {balance.toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {isPositive ? "Positivo" : "Negativo"}
                </div>
              </div>

              {!isPositive && (
                <p className="text-xs text-muted-foreground mt-3 pl-[52px]">
                  Com esse ritmo, seu caixa pode zerar em poucos dias. Veja a projeção completa.
                </p>
              )}
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-8 space-y-4">
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
              onClick={handleSimulate}
            >
              Gerar previsão de 4 semanas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-success" /> Sem cadastro</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-success" /> Resultado instantâneo</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-success" /> 100% gratuito</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
