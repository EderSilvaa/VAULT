import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import Logo from "@/components/Logo";

const Signup = () => {
  const { loginWithGoogle, loading, isAuthenticated } = useAuth();
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignup = async () => {
    try {
      setError("");
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <div className="w-full max-w-md mb-6 animate-fade-in relative z-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
      </div>

      {/* Main Content */}
      <Card className="w-full max-w-md p-8 space-y-6 animate-fade-in-up relative z-10 border-0 bg-card/95 backdrop-blur-xl shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Criar Conta
          </h1>
          <p className="text-muted-foreground">
            Comece a gerenciar seu fluxo de caixa
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base relative hover:bg-muted text-foreground transition-all border-input hover:text-foreground"
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                Conectando...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 w-full">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    style={{ fill: "#4285F4" }}
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    style={{ fill: "#34A853" }}
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    style={{ fill: "#FBBC05" }}
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    style={{ fill: "#EA4335" }}
                  />
                </svg>
                <span className="font-medium">Cadastrar com Google</span>
              </div>
            )}
          </Button>
        </div>

        {/* Benefits */}
        <div className="pt-4 space-y-3 border-t border-border">
          <p className="text-sm font-semibold text-foreground">O que você ganha:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-success/10">
                <Check className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Dashboard completo de fluxo de caixa</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-success/10">
                <Check className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Projeções inteligentes com IA</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-success/10">
                <Check className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Alertas antes do caixa zerar</span>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Fazer login
          </Link>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Seus dados são protegidos e não compartilhamos com terceiros.
        </p>
      </Card>
    </div>
  );
};

export default Signup;
