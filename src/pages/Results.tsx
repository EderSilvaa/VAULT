import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingDown, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import Logo from "@/components/Logo";
import { useEffect, useState } from "react";

interface PredictionData {
  weeklyRevenue: number;
  fixedExpenses: number;
  variableExpenses: number;
}

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state as PredictionData;
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowAnimation(true), 300);
  }, []);

  if (!data) {
    navigate("/simulator");
    return null;
  }

  const weeklyCashFlow = data.weeklyRevenue - data.fixedExpenses - data.variableExpenses;
  const monthlyCashFlow = weeklyCashFlow * 4;
  const isPositive = weeklyCashFlow > 0;
  const daysUntilZero = isPositive ? null : Math.floor(Math.abs(10000 / (weeklyCashFlow / 7)));

  // Generate chart data (4 weeks)
  const chartData = Array.from({ length: 4 }, (_, i) => ({
    week: i + 1,
    balance: 10000 + (weeklyCashFlow * (i + 1)),
  }));

  const maxBalance = Math.max(...chartData.map(d => d.balance), 10000);
  const minBalance = Math.min(...chartData.map(d => d.balance), 0);

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <div className="w-full max-w-4xl mx-auto mb-6 animate-fade-in">
        <button
          onClick={() => navigate("/simulator")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Ajustar valores
        </button>
        <Logo size="md" />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-foreground">
            Sua Previsão de Caixa
          </h1>
          <p className="text-muted-foreground">
            Baseado nos seus dados atuais
          </p>
        </div>

        {/* Alert Card */}
        {!isPositive && (
          <Card className={`p-6 border-2 border-destructive bg-destructive/5 animate-fade-in ${showAnimation ? 'animate-pulse-glow' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-destructive">
                <AlertTriangle className="w-6 h-6 text-destructive-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-destructive mb-2">
                  Alerta: Seu caixa pode zerar em {daysUntilZero} dias
                </h3>
                <p className="text-muted-foreground">
                  Com o fluxo atual negativo de <span className="font-semibold text-foreground">R$ {Math.abs(weeklyCashFlow).toLocaleString('pt-BR')}</span> por semana, você precisará tomar ação.
                </p>
              </div>
            </div>
          </Card>
        )}

        {isPositive && (
          <Card className="p-6 border-2 border-success bg-success/5 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-success">
                <TrendingUp className="w-6 h-6 text-success-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-success mb-2">
                  Fluxo positivo!
                </h3>
                <p className="text-muted-foreground">
                  Seu caixa está crescendo <span className="font-semibold text-foreground">R$ {weeklyCashFlow.toLocaleString('pt-BR')}</span> por semana.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Chart */}
        <Card className="p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h3 className="font-semibold text-lg mb-4 text-foreground">Projeção de 4 Semanas</h3>
          <div className="space-y-4">
            <div className="relative h-64 flex items-end justify-between gap-2 px-4">
              {/* Y-axis */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
                <span>R$ {maxBalance.toLocaleString('pt-BR')}</span>
                <span>R$ {((maxBalance + minBalance) / 2).toLocaleString('pt-BR')}</span>
                <span>R$ {minBalance.toLocaleString('pt-BR')}</span>
              </div>
              
              {/* Bars */}
              <div className="flex-1 flex items-end justify-around gap-4 ml-20">
                {chartData.map((item, i) => {
                  const heightPercent = ((item.balance - minBalance) / (maxBalance - minBalance)) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 animate-slide-in" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="relative w-full flex flex-col items-center">
                        <span className="text-sm font-semibold mb-1 text-foreground">
                          R$ {item.balance.toLocaleString('pt-BR')}
                        </span>
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-1000 ${
                            item.balance > 10000 ? 'bg-gradient-success' : 'bg-gradient-alert'
                          }`}
                          style={{ height: `${Math.max(heightPercent, 5)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">Sem. {item.week}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Zero line indicator */}
            {minBalance < 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                <TrendingDown className="w-4 h-4" />
                <span>Linha vermelha = caixa negativo</span>
              </div>
            )}
          </div>
        </Card>

        {/* Suggestion Card */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-primary">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-bold text-lg text-foreground">Sugestão Inteligente</h3>
              {!isPositive ? (
                <div className="space-y-2 text-muted-foreground">
                  <p>Para evitar ficar no vermelho, você pode:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Antecipar R$ {Math.abs(monthlyCashFlow).toLocaleString('pt-BR')} em recebíveis</li>
                    <li>Reduzir despesas variáveis em {((data.variableExpenses * 0.2) / data.variableExpenses * 100).toFixed(0)}%</li>
                    <li>Buscar aumentar receita em {((Math.abs(weeklyCashFlow) / data.weeklyRevenue) * 100).toFixed(0)}%</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-2 text-muted-foreground">
                  <p>Seu fluxo está positivo! Continue assim e considere:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Criar uma reserva de emergência</li>
                    <li>Investir em crescimento do negócio</li>
                    <li>Antecipar pagamento de dívidas para economizar juros</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* CTA */}
        <Card className="p-6 text-center space-y-4 bg-gradient-primary animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h3 className="font-bold text-xl text-white">
            Quer receber alertas automáticos?
          </h3>
          <p className="text-white/90">
            A Vault te avisa antes do aperto e sugere o que fazer
          </p>
          <Button 
            variant="outline" 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 border-white"
            onClick={() => navigate("/signup")}
          >
            Quero receber alertas
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Results;
