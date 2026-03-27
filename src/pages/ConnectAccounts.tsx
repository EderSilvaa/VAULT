import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, ArrowRight, Shield, Building2, Target, Bell } from "lucide-react";
import Logo from "@/components/Logo";
import { NubankLogo, ItauLogo, InterLogo, SantanderLogo } from "@/components/BankLogos";

const ConnectAccounts = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    businessType: "",
    goal: "",
    alertPreference: ""
  });

  const banks = [
    {
      name: "Nubank",
      logo: NubankLogo,
      bgColor: "bg-[#8A05BE]/5",
      borderColor: "border-[#8A05BE]/20",
      hoverColor: "hover:border-[#8A05BE]"
    },
    {
      name: "Itaú",
      logo: ItauLogo,
      bgColor: "bg-[#EC7000]/5",
      borderColor: "border-[#EC7000]/20",
      hoverColor: "hover:border-[#EC7000]"
    },
    {
      name: "Inter",
      logo: InterLogo,
      bgColor: "bg-[#FF7A00]/5",
      borderColor: "border-[#FF7A00]/20",
      hoverColor: "hover:border-[#FF7A00]"
    },
    {
      name: "Santander",
      logo: SantanderLogo,
      bgColor: "bg-white",
      borderColor: "border-[#EC0000]/20",
      hoverColor: "hover:border-[#EC0000]"
    }
  ];

  const handleConnect = () => {
    setStep(2);
  };

  const handleContinue = () => {
    navigate("/dashboard");
  };

  const progressValue = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-xl font-bold text-primary-foreground">Vault</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Etapa {step} de 3</span>
            <div className="w-32">
              <Progress value={progressValue} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {step === 1 && (
          <div className="animate-fade-in space-y-8">
            {/* Main card */}
            <Card className="p-10 bg-card/90 backdrop-blur-md border-primary/30 shadow-2xl">
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-2">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Conecte sua conta bancária
                  </h1>
                  <p className="text-muted-foreground text-base max-w-md mx-auto">
                    Conexão segura via Open Finance do Banco Central.
                    <span className="block text-foreground font-medium mt-1">Seus dados estão 100% protegidos.</span>
                  </p>
                </div>

                {/* Banks grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                  {banks.map((bank, index) => {
                    const BankLogoComponent = bank.logo;
                    return (
                      <div
                        key={bank.name}
                        className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl ${bank.bgColor} border-2 ${bank.borderColor} ${bank.hoverColor} hover:shadow-xl transition-all hover:scale-[1.03] cursor-pointer group animate-fade-in`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden shadow-md">
                          <BankLogoComponent className="w-full h-full object-cover" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Authorization button */}
                <div className="space-y-4 pt-4">
                  <Button
                    onClick={handleConnect}
                    size="lg"
                    className="w-full text-base h-14 bg-gradient-primary hover:scale-[1.02] transition-transform shadow-lg"
                  >
                    <Lock className="mr-2 w-5 h-5" />
                    Conectar com Open Finance
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Regulamentado pelo Banco Central · Criptografia de nível bancário
                  </p>
                </div>
              </div>
            </Card>

            {/* Security features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Shield, title: "Criptografia bancária", desc: "Mesmo padrão dos bancos" },
                { icon: Lock, title: "Sem armazenar senhas", desc: "Acesso via Open Finance" },
                { icon: Building2, title: "Regulado pelo BC", desc: "Infraestrutura oficial" }
              ].map((feature, index) => (
                <Card key={index} className="p-5 bg-card/70 backdrop-blur-sm border-border/50 hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1 text-foreground">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <Card className="p-10 bg-card/90 backdrop-blur-md border-primary/30 shadow-2xl max-w-2xl mx-auto">
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-success/70 mb-2 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground">
                    Conexão estabelecida
                  </h2>
                  <p className="text-muted-foreground text-base">
                    Personalize sua experiência respondendo 3 perguntas
                  </p>
                </div>

                <div className="space-y-6 pt-4">
                  {/* Question 1 */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      Tipo de negócio
                    </Label>
                    <Select onValueChange={(value) => setProfile({...profile, businessType: value})}>
                      <SelectTrigger className="h-13 bg-background border-2 border-border hover:border-primary/50 transition-colors text-base">
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-primary/20">
                        <SelectItem value="mei" className="text-base">MEI</SelectItem>
                        <SelectItem value="autonomo" className="text-base">Autônomo</SelectItem>
                        <SelectItem value="empresa" className="text-base">Empresa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question 2 */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      Principal meta financeira
                    </Label>
                    <Select onValueChange={(value) => setProfile({...profile, goal: value})}>
                      <SelectTrigger className="h-13 bg-background border-2 border-border hover:border-primary/50 transition-colors text-base">
                        <SelectValue placeholder="Selecione sua meta" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-primary/20">
                        <SelectItem value="dividas" className="text-base">Reduzir dívidas</SelectItem>
                        <SelectItem value="fluxo" className="text-base">Manter fluxo de caixa saudável</SelectItem>
                        <SelectItem value="investir" className="text-base">Investir no negócio</SelectItem>
                        <SelectItem value="crescer" className="text-base">Crescer a empresa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question 3 */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      Preferência de alertas
                    </Label>
                    <Select onValueChange={(value) => setProfile({...profile, alertPreference: value})}>
                      <SelectTrigger className="h-13 bg-background border-2 border-border hover:border-primary/50 transition-colors text-base">
                        <SelectValue placeholder="Escolha o canal de notificação" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-primary/20">
                        <SelectItem value="whatsapp" className="text-base">WhatsApp</SelectItem>
                        <SelectItem value="email" className="text-base">E-mail</SelectItem>
                        <SelectItem value="app" className="text-base">Notificações no app</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleContinue}
                  size="lg"
                  disabled={!profile.businessType || !profile.goal || !profile.alertPreference}
                  className="w-full text-base h-14 bg-gradient-primary hover:scale-[1.02] transition-transform mt-8 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Acessar Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground text-sm">
          Transparência e controle em cada dado. Essa é a Vault.
        </p>
      </footer>
    </div>
  );
};

export default ConnectAccounts;
