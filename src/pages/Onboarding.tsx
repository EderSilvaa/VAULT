import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  Mail,
  FileText,
  ShieldOff,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Bell,
  Sparkles,
  Zap,
  Target,
  Brain,
  Upload,
  Smartphone,
} from "lucide-react";
import Logo from "@/components/Logo";

/* ───────────────────────────────────────────
   Dashboard Mockup — visual product preview
   ─────────────────────────────────────────── */
const DashboardMockup = () => (
  <div className="w-full max-w-[520px] mx-auto select-none">
    {/* Window chrome */}
    <div className="rounded-xl md:rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        </div>
        <span className="text-[10px] text-muted-foreground ml-2 font-medium">vault.tec.br/dashboard</span>
      </div>

      {/* Dashboard body */}
      <div className="p-4 md:p-5 space-y-4">
        {/* Top stats row */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="rounded-lg bg-muted/40 p-2.5 md:p-3">
            <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium">Saldo atual</p>
            <p className="text-sm md:text-base font-bold text-foreground tracking-tight">R$ 4.230</p>
            <p className="text-[9px] text-success font-medium mt-0.5">+12% vs mês anterior</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5 md:p-3">
            <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium">Receita mensal</p>
            <p className="text-sm md:text-base font-bold text-foreground tracking-tight">R$ 8.500</p>
            <p className="text-[9px] text-success font-medium mt-0.5">+3 recebimentos</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5 md:p-3">
            <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium">Despesas</p>
            <p className="text-sm md:text-base font-bold text-foreground tracking-tight">R$ 6.120</p>
            <p className="text-[9px] text-destructive font-medium mt-0.5">72% da receita</p>
          </div>
        </div>

        {/* Chart area */}
        <div className="rounded-lg bg-muted/20 border border-border/30 p-3 md:p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] md:text-xs font-semibold text-foreground">Projeção de caixa — 4 semanas</p>
            <div className="flex gap-3 text-[9px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Realizado</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary/40" /> Projeção</span>
            </div>
          </div>
          {/* SVG Chart */}
          <svg viewBox="0 0 400 120" className="w-full h-auto" fill="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(270 75% 55%)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(270 75% 55%)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1="0" y1="30" x2="400" y2="30" stroke="hsl(250 20% 90%)" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1="60" x2="400" y2="60" stroke="hsl(250 20% 90%)" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1="90" x2="400" y2="90" stroke="hsl(250 20% 90%)" strokeWidth="0.5" strokeDasharray="4 4" />
            {/* Area fill */}
            <path d="M0,80 C30,75 60,70 100,55 C140,40 170,35 200,38 C230,41 250,45 280,50 C310,55 340,48 370,42 L400,38 L400,120 L0,120 Z" fill="url(#chartGrad)" />
            {/* Solid line — Realizado */}
            <path d="M0,80 C30,75 60,70 100,55 C140,40 170,35 200,38" stroke="hsl(270 75% 55%)" strokeWidth="2.5" strokeLinecap="round" />
            {/* Dashed line — Projeção */}
            <path d="M200,38 C230,41 250,45 280,50 C310,55 340,48 370,42 L400,38" stroke="hsl(270 75% 55%)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" opacity="0.5" />
            {/* Current point */}
            <circle cx="200" cy="38" r="4" fill="hsl(270 75% 55%)" />
            <circle cx="200" cy="38" r="7" fill="hsl(270 75% 55%)" opacity="0.2" />
          </svg>
          {/* X labels */}
          <div className="flex justify-between mt-1 text-[8px] md:text-[9px] text-muted-foreground px-1">
            <span>Sem 1</span><span>Sem 2</span><span>Hoje</span><span>Sem 3</span><span>Sem 4</span>
          </div>
        </div>

        {/* Alert bar */}
        <div className="flex items-center gap-2.5 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2">
          <Bell className="w-3.5 h-3.5 text-warning shrink-0" />
          <p className="text-[10px] md:text-[11px] text-foreground">
            <span className="font-semibold">Alerta:</span> Caixa pode ficar apertado na semana 3 — considere antecipar recebíveis.
          </p>
        </div>

        {/* Recent transactions */}
        <div className="space-y-1.5">
          {[
            { desc: "NF-e #4312 — Cliente ABC", val: "+R$ 2.800", color: "text-success" },
            { desc: "Aluguel escritório", val: "-R$ 1.500", color: "text-destructive" },
            { desc: "PIX — Fornecedor XYZ", val: "-R$ 680", color: "text-destructive" },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/30 transition-colors">
              <span className="text-[10px] md:text-[11px] text-muted-foreground truncate mr-3">{tx.desc}</span>
              <span className={`text-[10px] md:text-[11px] font-semibold ${tx.color} shrink-0 tabular-nums`}>{tx.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ───────────────────────────────────────────
   Main Landing Page
   ─────────────────────────────────────────── */
const Onboarding = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Subtle background gradient (static, no animation) ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.07] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/[0.05] rounded-full blur-[120px]" />
      </div>

      {/* ══════════════════════════════════════
          HEADER
          ══════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Recursos", id: "features" },
              { label: "Como Funciona", id: "how-it-works" },
              { label: "Diferenciais", id: "benefits" },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-sm">
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate("/simulator")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Começar grátis
            </Button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════
          HERO — Split layout com product preview
          ══════════════════════════════════════ */}
      <section className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div className="max-w-xl space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                Copiloto financeiro com IA
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
                Preveja seu caixa
                <br />
                <span className="text-primary">antes do aperto</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-md">
                A Vault analisa suas finanças e te avisa antes do caixa zerar.
                Sugestões práticas, não planilhas.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate("/simulator")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 text-base"
                >
                  Começar agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => scrollToSection("how-it-works")}
                  className="h-12 px-6 text-base"
                >
                  Como funciona
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" /> Sem cadastro</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" /> 2 min pra começar</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" /> 100% gratuito</span>
              </div>
            </div>

            {/* Right — Product mockup */}
            <div className="animate-fade-in lg:pl-4" style={{ animationDelay: "0.15s" }}>
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS BAR — números de confiança
          ══════════════════════════════════════ */}
      <section className="border-y border-border/40 bg-muted/20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 py-10 md:py-12">
          <div className="grid grid-cols-3 gap-6 md:gap-12 max-w-3xl mx-auto text-center">
            {[
              { value: "4 sem", label: "Projeção antecipada" },
              { value: "2 min", label: "Primeira análise" },
              { value: "100%", label: "Gratuito" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">{stat.value}</div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ANTI OPEN FINANCE
          ══════════════════════════════════════ */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-5 gap-10 md:gap-14 items-start">
              {/* Left col — 3/5 */}
              <div className="md:col-span-3 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider">
                  <ShieldOff className="w-3.5 h-3.5" />
                  Sem Open Finance
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
                  Seus dados de compra,{" "}
                  <span className="text-primary">sem depender de banco nenhum.</span>
                </h2>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Open Finance é lento, burocrático e cheio de fricção.
                  A Vault puxa seus dados <strong className="text-foreground">direto do Gmail e dos seus extratos</strong> — NF-e, PIX, boletos. Zero integração bancária.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-card">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Gmail Scanner</p>
                      <p className="text-xs text-muted-foreground">IA lê seus e-mails financeiros</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-card">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Extrato Bancário</p>
                      <p className="text-xs text-muted-foreground">Importa OFX, CSV e Excel</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right col — 2/5 checklist */}
              <div className="md:col-span-2 space-y-3 md:pt-14">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">O que a Vault captura</p>
                {[
                  "NF-e e Notas Fiscais",
                  "PIX enviado e recebido",
                  "Boletos pagos",
                  "Transferências bancárias",
                  "Faturas de serviço",
                  "Parcelas e recorrências",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES — 3 colunas clean
          ══════════════════════════════════════ */}
      <section id="features" className="relative z-10 py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Recursos principais</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Seu caixa sob controle
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-4 leading-relaxed">
              Ferramentas com IA para você nunca mais ser pego de surpresa
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Brain,
                title: "Previsão Automática",
                desc: "IA analisa seu fluxo e projeta as próximas 4 semanas. Veja exatamente quando o dinheiro vai apertar.",
                accent: "text-primary bg-primary/10",
              },
              {
                icon: Bell,
                title: "Alertas Inteligentes",
                desc: "Avisos no WhatsApp antes do caixa zerar. Sistema multicamada que aprende com seu comportamento.",
                accent: "text-warning bg-warning/10",
              },
              {
                icon: Target,
                title: "Sugestões Práticas",
                desc: "Dicas personalizadas: antecipe recebíveis, corte custos desnecessários, identifique oportunidades.",
                accent: "text-success bg-success/10",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border/50 bg-card p-6 md:p-8 hover:border-border transition-colors"
              >
                <div className={`w-11 h-11 rounded-lg ${feature.accent} flex items-center justify-center mb-5`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS — horizontal steps
          ══════════════════════════════════════ */}
      <section id="how-it-works" className="relative z-10 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Processo simplificado</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Simples em 3 passos
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-4 leading-relaxed">
              Não precisa ser expert em finanças. A Vault faz o trabalho pesado.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 max-w-4xl mx-auto relative">
            {/* Connecting line — desktop only */}
            <div className="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] h-[1px] bg-border" />

            {[
              {
                step: "1",
                icon: BarChart3,
                title: "Informe seus números",
                desc: "Receita, despesas fixas e variáveis. 3 campos, menos de 30 segundos.",
              },
              {
                step: "2",
                icon: TrendingUp,
                title: "Veja a projeção",
                desc: "Gráfico claro mostrando se você vai ficar positivo ou negativo nas próximas semanas.",
              },
              {
                step: "3",
                icon: Smartphone,
                title: "Receba alertas",
                desc: "A Vault avisa no WhatsApp antes do aperto e sugere exatamente o que fazer.",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="relative z-10 w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-5 shadow-sm">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SOCIAL PROOF — Para quem
          ══════════════════════════════════════ */}
      <section className="relative z-10 py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Feito para você</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Quem usa a Vault?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-4 leading-relaxed">
              Empreendedores que não podem se dar ao luxo de ficar sem caixa
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: TrendingUp,
                persona: "MEI / Autônomo",
                pain: "Receita irregular, meses bons e meses apertados. Precisa saber se o dinheiro vai dar até o fim do mês.",
              },
              {
                icon: TrendingDown,
                persona: "Prestador de Serviço",
                pain: "Clientes que atrasam pagamento e despesas fixas que não esperam. Precisa antecipar o gap de caixa.",
              },
              {
                icon: BarChart3,
                persona: "Pequeno Comércio",
                pain: "Estoque, aluguel, funcionário — tudo vence junto. Precisa de visibilidade para planejar compras.",
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-6 md:p-8">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">{item.persona}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          BENEFITS — diferenciais com ícones
          ══════════════════════════════════════ */}
      <section id="benefits" className="relative z-10 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Diferenciais</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Por que escolher a Vault?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Zap, title: "Zero Burocracia", desc: "Sem planilhas complexas ou processos complicados. Tudo automatizado." },
              { icon: ShieldOff, title: "Dados Seguros", desc: "Criptografia de ponta a ponta. Suas informações são privadas e protegidas." },
              { icon: Brain, title: "IA Inteligente", desc: "Machine Learning que aprende com seu histórico para previsões mais precisas." },
              { icon: Bell, title: "Alertas Práticos", desc: "Notificações no WhatsApp quando você mais precisa, com ações sugeridas." },
            ].map((b, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-6 hover:border-border transition-colors">
                <b.icon className="w-5 h-5 text-primary mb-4" />
                <h3 className="text-base font-semibold text-foreground mb-1.5 tracking-tight">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA FINAL
          ══════════════════════════════════════ */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto rounded-2xl bg-primary p-8 sm:p-12 md:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground leading-tight tracking-tight">
              Nunca mais seja pego
              <br />
              de surpresa
            </h2>

            <p className="text-base sm:text-lg text-primary-foreground/80 mt-5 max-w-xl mx-auto leading-relaxed">
              Comece agora a prever seu caixa e receba alertas antes de faltar dinheiro.
              Rápido, fácil e 100% gratuito.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 h-12 px-8 text-base font-semibold"
                onClick={() => navigate("/simulator")}
              >
                Começar agora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-primary-foreground/70 text-sm">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Sem compromisso</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Resultado instantâneo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
          ══════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 py-10 md:py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div className="max-w-sm space-y-3">
              <Logo size="md" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Copiloto financeiro com IA que prevê problemas de caixa antes que aconteçam. Feito para MEIs e pequenos negócios.
              </p>
            </div>

            <nav className="flex gap-8">
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Produto</p>
                <button onClick={() => scrollToSection("features")} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</button>
                <button onClick={() => scrollToSection("how-it-works")} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Como Funciona</button>
                <button onClick={() => navigate("/simulator")} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Simulador</button>
              </div>
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Conta</p>
                <button onClick={() => navigate("/login")} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Entrar</button>
                <button onClick={() => navigate("/signup")} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Criar conta</button>
              </div>
            </nav>
          </div>

          <div className="pt-6 border-t border-border/40">
            <p className="text-xs text-muted-foreground">© 2026 Vault Finanças. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
