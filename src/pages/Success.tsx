import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Smartphone, TrendingUp } from "lucide-react";
import Logo from "@/components/Logo";
import { useEffect, useState } from "react";

const Success = () => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full animate-fade-in"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                opacity: Math.random() * 0.5 + 0.3,
              }}
            />
          ))}
        </div>
      )}

      {/* Logo */}
      <div className="mb-8 animate-fade-in">
        <Logo size="lg" />
      </div>

      {/* Main Content */}
      <Card className="w-full max-w-md p-8 space-y-6 text-center animate-scale-in shadow-glow">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-success/10 animate-pulse-glow">
            <CheckCircle className="w-16 h-16 text-success" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Tudo pronto!
          </h1>
          <p className="text-lg text-muted-foreground">
            A partir de agora, a Vault te avisa antes do aperto
          </p>
        </div>

        {/* What's next */}
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 text-left">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Alertas no WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                Receba avisos quando seu caixa precisar de atenção
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 text-left">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Previsões semanais</h3>
              <p className="text-sm text-muted-foreground">
                Análises automáticas do seu fluxo de caixa
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button 
            variant="gradient" 
            size="lg" 
            className="w-full"
            onClick={() => navigate("/")}
          >
            Voltar ao início
          </Button>
          
          <Button 
            variant="ghost" 
            size="lg" 
            className="w-full"
            onClick={() => navigate("/simulator")}
          >
            Fazer nova simulação
          </Button>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Em breve você receberá sua primeira análise personalizada
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Success;
