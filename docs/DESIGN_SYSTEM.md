# 🎨 Vault Design System

Documentação completa do sistema de design da plataforma Vault, incluindo cores, tipografia, componentes, padrões e diretrizes de uso.

---

## 📋 Índice

1. [Filosofia de Design](#filosofia-de-design)
2. [Paleta de Cores](#paleta-de-cores)
3. [Tipografia](#tipografia)
4. [Espaçamento e Layout](#espaçamento-e-layout)
5. [Componentes UI](#componentes-ui)
6. [Gradientes e Efeitos](#gradientes-e-efeitos)
7. [Ícones e Imagens](#ícones-e-imagens)
8. [Modo Dark](#modo-dark)
9. [Responsividade](#responsividade)
10. [Acessibilidade](#acessibilidade)

---

## 🎯 Filosofia de Design

O design system da Vault é construído com foco em:

- **Profissionalismo**: Interface limpa e confiável para gestão financeira
- **Clareza**: Informações financeiras apresentadas de forma clara e direta
- **Modernidade**: Visual contemporâneo com gradientes sutis e animações suaves
- **Performance**: Otimizado para carregamento rápido em dispositivos móveis
- **Acessibilidade**: Cores com contraste adequado e suporte a modo escuro

---

## 🎨 Paleta de Cores

Todas as cores são definidas no formato **HSL** para facilitar manipulações de opacidade e variações.

### Cores Primárias

| Nome | HSL (Light) | HSL (Dark) | Uso |
|------|-------------|------------|-----|
| **Primary** | `270 75% 55%` | `270 75% 60%` | Botões principais, links, elementos de destaque |
| **Primary Glow** | `270 85% 65%` | `270 85% 70%` | Efeitos de brilho e hover |
| **Secondary** | `270 60% 45%` | `270 60% 50%` | Botões secundários, elementos de suporte |

### Cores Funcionais

| Nome | HSL | Uso |
|------|-----|-----|
| **Success** | `142 76% 36%` | Receitas, metas alcançadas, confirmações |
| **Warning** | `38 92% 50%` | Alertas, avisos, limites próximos |
| **Destructive** | `0 84% 60%` | Despesas, erros, ações destrutivas |

### Cores Neutras

| Nome | HSL (Light) | HSL (Dark) | Uso |
|------|-------------|------------|-----|
| **Background** | `250 30% 98%` | `270 45% 8%` | Fundo principal da aplicação |
| **Foreground** | `270 50% 12%` | `250 20% 95%` | Texto principal |
| **Card** | `0 0% 100%` | `270 40% 12%` | Fundo de cards e painéis |
| **Muted** | `250 25% 94%` | `270 35% 20%` | Fundos secundários |
| **Muted Foreground** | `250 15% 45%` | `250 15% 65%` | Texto secundário/legendas |
| **Border** | `250 20% 90%` | `270 35% 25%` | Bordas de elementos |

### Exemplo de Uso

```tsx
// Usando cores do sistema
<div className="bg-primary text-primary-foreground">
  Botão Primário
</div>

<div className="bg-success text-success-foreground">
  + R$ 1.500,00
</div>

<div className="bg-destructive text-destructive-foreground">
  - R$ 800,00
</div>
```

---

## 📝 Tipografia

### Fonte

A Vault utiliza a **fonte padrão do sistema** (system font stack) para melhor performance e consistência com o SO do usuário.

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Hierarquia de Tamanhos

| Elemento | Classe Tailwind | Tamanho | Peso | Uso |
|----------|-----------------|---------|------|-----|
| **Hero Title** | `text-6xl` | 3.75rem (60px) | Bold | Títulos de landing pages |
| **Page Title** | `text-4xl` | 2.25rem (36px) | Bold | Títulos de páginas |
| **Section Title** | `text-3xl` | 1.875rem (30px) | Semibold | Títulos de seções |
| **Card Title** | `text-2xl` | 1.5rem (24px) | Semibold | Títulos de cards |
| **Subtitle** | `text-xl` | 1.25rem (20px) | Medium | Subtítulos |
| **Body Large** | `text-lg` | 1.125rem (18px) | Regular | Texto de destaque |
| **Body** | `text-base` | 1rem (16px) | Regular | Texto padrão |
| **Body Small** | `text-sm` | 0.875rem (14px) | Regular | Texto secundário |
| **Caption** | `text-xs` | 0.75rem (12px) | Regular | Legendas, labels |

### Exemplo de Uso

```tsx
<h1 className="text-4xl font-bold text-foreground">
  Dashboard Financeiro
</h1>

<p className="text-base text-muted-foreground">
  Visualize todas as suas transações e metas
</p>

<span className="text-xs text-muted-foreground">
  Atualizado há 5 minutos
</span>
```

---

## 📐 Espaçamento e Layout

### Border Radius

| Nome | Valor | Uso |
|------|-------|-----|
| **Default** | `0.75rem` (12px) | Cards, botões, inputs |
| **Small** | `0.5rem` (8px) | Tags, badges |
| **Large** | `1rem` (16px) | Modais, painéis grandes |
| **XL** | `1.5rem` (24px) | Elementos de destaque |
| **Full** | `9999px` | Avatares, ícones circulares |

### Espaçamento

Seguimos a escala de espaçamento do Tailwind CSS:

| Classe | Valor | Uso Comum |
|--------|-------|-----------|
| `p-2` | 0.5rem (8px) | Padding interno pequeno |
| `p-4` | 1rem (16px) | Padding padrão |
| `p-6` | 1.5rem (24px) | Padding de cards |
| `gap-4` | 1rem (16px) | Espaçamento entre elementos |
| `space-y-6` | 1.5rem (24px) | Espaçamento vertical entre seções |

---

## 🧩 Componentes UI

### Button

Componente de botão com múltiplas variantes e tamanhos.

**Variantes:**

```tsx
// Primary (padrão)
<Button variant="default">Salvar</Button>

// Gradient (destaque máximo)
<Button variant="gradient">Começar Agora</Button>

// Success
<Button variant="success">Confirmar</Button>

// Destructive
<Button variant="destructive">Excluir</Button>

// Outline
<Button variant="outline">Cancelar</Button>

// Ghost (transparente)
<Button variant="ghost">Fechar</Button>

// Link
<Button variant="link">Saiba mais</Button>
```

**Tamanhos:**

```tsx
<Button size="sm">Pequeno</Button>
<Button size="default">Padrão</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><Icon /></Button>
```

**Características:**
- Transições suaves de 300ms
- Efeitos hover com shadow-glow
- Estados disabled com 50% de opacidade
- Focus ring para acessibilidade

---

### Card

Componente de card para agrupar conteúdo relacionado.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Saldo Atual</CardTitle>
    <CardDescription>Seu saldo disponível em todas as contas</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">R$ 5.432,90</p>
  </CardContent>
  <CardFooter>
    <Button variant="ghost">Ver detalhes</Button>
  </CardFooter>
</Card>
```

**Variações comuns:**

```tsx
// Card com gradiente
<Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl">

// Card com hover
<Card className="hover:-translate-y-1 transition-all duration-300">

// Card com borda colorida
<Card className="border-primary">
```

---

### Badge

Componente para tags e status.

```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Pendente</Badge>
<Badge variant="destructive">Atrasado</Badge>
<Badge variant="outline">Opcional</Badge>
```

---

### Input

Campo de entrada de dados.

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="seu@email.com"
  />
</div>
```

---

### Outros Componentes

- **Dialog**: Modais e diálogos
- **Dropdown Menu**: Menus suspensos
- **Select**: Seletores customizados
- **Checkbox**: Caixas de seleção
- **Switch**: Alternadores (toggle)
- **Slider**: Controles deslizantes
- **Progress**: Barras de progresso
- **Toast/Sonner**: Notificações temporárias
- **Tooltip**: Dicas contextuais
- **Calendar**: Seletor de datas
- **Separator**: Divisores visuais
- **Skeleton**: Estados de loading
- **Scroll Area**: Áreas roláveis customizadas

Todos os componentes seguem o padrão de composição do Radix UI com estilização via Tailwind CSS.

---

## ✨ Gradientes e Efeitos

### Gradientes Predefinidos

```css
/* Gradiente primário (roxo) */
--gradient-primary: linear-gradient(135deg, hsl(270 75% 55%), hsl(270 60% 45%));

/* Gradiente de sucesso (verde) */
--gradient-success: linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 46%));

/* Gradiente de alerta (vermelho) */
--gradient-alert: linear-gradient(135deg, hsl(0 84% 60%), hsl(0 84% 70%));
```

**Uso no código:**

```tsx
// Via classe CSS
<div className="bg-gradient-primary" />

// Via Tailwind
<div className="bg-gradient-to-br from-primary to-secondary" />

// Com opacidade
<div className="bg-gradient-to-br from-primary/20 to-secondary/10" />
```

### Sombras

```css
/* Sombra suave */
--shadow-soft: 0 2px 20px -2px hsl(270 75% 55% / 0.15);

/* Sombra com brilho */
--shadow-glow: 0 0 40px hsl(270 75% 55% / 0.25);
```

**Uso:**

```tsx
<Card className="shadow-soft hover:shadow-glow transition-shadow">
```

### Efeitos de Backdrop

```tsx
// Blur com transparência
<div className="backdrop-blur-xl bg-card/95" />

// Blur completo
<div className="backdrop-blur-2xl" />
```

### Animações

```tsx
// Hover lift
<Card className="hover:-translate-y-1 transition-all duration-300">

// Hover scale
<Button className="hover:scale-105 transition-transform">

// Pulse (loading)
<div className="animate-pulse" />

// Pulse com brilho
<div className="animate-pulse-glow" />
```

---

## 🎴 Ícones e Imagens

### Biblioteca de Ícones

A Vault utiliza **Lucide React** para ícones:

```tsx
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target
} from 'lucide-react'

<TrendingUp className="w-6 h-6 text-success" />
```

### Padrões de Uso

**Ícones em Cards:**
```tsx
<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
  <DollarSign className="w-6 h-6 text-primary" />
</div>
```

**Ícones em Botões:**
```tsx
<Button>
  <Plus className="w-4 h-4" />
  Nova Transação
</Button>
```

**Avatares:**
```tsx
<div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
  <span className="text-sm font-medium text-white">ED</span>
</div>
```

---

## 🌙 Modo Dark

O Vault possui suporte completo a modo escuro (dark mode).

### Alternância de Tema

```tsx
// Adicionar classe 'dark' ao elemento root
document.documentElement.classList.add('dark')
document.documentElement.classList.remove('dark')
```

### Diferenças no Dark Mode

| Elemento | Light Mode | Dark Mode |
|----------|------------|-----------|
| Background | `250 30% 98%` (quase branco) | `270 45% 8%` (quase preto) |
| Card | `0 0% 100%` (branco) | `270 40% 12%` (cinza escuro) |
| Border | `250 20% 90%` (cinza claro) | `270 35% 25%` (cinza escuro) |
| Primary | `270 75% 55%` | `270 75% 60%` (mais brilhante) |

### Dicas de Uso

```tsx
// Cores que se adaptam automaticamente
<div className="bg-background text-foreground" />

// Cores específicas por modo
<div className="bg-white dark:bg-slate-900" />

// Bordas adaptativas
<div className="border border-border" />
```

---

## 📱 Responsividade

### Breakpoints

```css
/* Mobile First - Base styles aplicam-se a mobile */
.container { /* mobile styles */ }

/* Tablet */
@media (min-width: 768px) { /* md: */ }

/* Desktop */
@media (min-width: 1024px) { /* lg: */ }

/* Large Desktop */
@media (min-width: 1280px) { /* xl: */ }
```

### Otimizações Mobile

Para melhorar performance em dispositivos móveis, o Vault desabilita efeitos pesados:

```css
@media (max-width: 767px) {
  /* Remove blur effects */
  .backdrop-blur-xl {
    backdrop-filter: none;
    background-color: hsl(var(--card));
  }

  /* Reduce shadows */
  .shadow-2xl {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  /* Disable hover animations */
  .hover\:-translate-y-1:hover {
    transform: none;
  }

  /* Simplify gradients (except special pages) */
  .bg-gradient-to-br:not(.mobile-gradient-preserve) {
    background: hsl(var(--card));
  }

  /* Hide animated background elements */
  .animate-pulse-glow {
    display: none;
  }
}
```

### Grid Responsivo

```tsx
// KPIs Grid - Adapta de 1 coluna (mobile) a 5 (desktop)
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
  <KPICard />
  <KPICard />
  <KPICard />
  <KPICard />
  <KPICard />
</div>

// Dashboard Grid - 2 colunas no desktop
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <Chart />
  <Transactions />
</div>
```

### Tamanhos Responsivos

```tsx
// Texto que diminui em mobile
<h1 className="text-3xl md:text-4xl lg:text-6xl font-bold">

// Padding que aumenta em telas maiores
<div className="p-4 md:p-6 lg:p-8">

// Gap que cresce com a tela
<div className="gap-2 md:gap-4 lg:gap-6">
```

---

## ♿ Acessibilidade

### Contraste de Cores

Todas as combinações de cores seguem as diretrizes **WCAG 2.1 Level AA**:

- Texto normal: mínimo 4.5:1
- Texto grande (18px+): mínimo 3:1
- Elementos de UI: mínimo 3:1

### Focus States

```tsx
// Focus ring visível para navegação por teclado
<Button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
```

### Semântica HTML

```tsx
// Usar elementos semânticos apropriados
<nav>...</nav>
<main>...</main>
<article>...</article>
<section>...</section>

// Labels para inputs
<Label htmlFor="email">Email</Label>
<Input id="email" />

// Alt text para imagens
<img src="chart.png" alt="Gráfico de despesas mensais" />
```

### ARIA Labels

```tsx
// Para ícones sem texto
<button aria-label="Fechar modal">
  <X className="w-4 h-4" />
</button>

// Para estados dinâmicos
<div role="status" aria-live="polite">
  {loading ? 'Carregando...' : 'Dados carregados'}
</div>
```

---

## 📋 Checklist de Implementação

Ao criar novos componentes ou páginas, siga este checklist:

- [ ] Usar cores do design system (via CSS variables)
- [ ] Implementar versão dark mode
- [ ] Adicionar estados hover/focus/disabled
- [ ] Testar em mobile (< 768px)
- [ ] Verificar contraste de cores (WCAG AA)
- [ ] Adicionar labels e ARIA quando necessário
- [ ] Usar componentes UI existentes sempre que possível
- [ ] Adicionar animações suaves (300ms duration)
- [ ] Testar com navegação por teclado
- [ ] Verificar performance (desabilitar efeitos em mobile se necessário)

---

## 🎯 Padrões Comuns

### Card Premium (com efeitos)

```tsx
<Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1 group">
  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  <CardContent className="relative">
    {/* Conteúdo */}
  </CardContent>
</Card>
```

### KPI Card

```tsx
<Card className="bg-white/95 backdrop-blur">
  <CardContent className="pt-6">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Saldo Atual
        </p>
        <p className="text-3xl font-bold">
          R$ 5.432,90
        </p>
        <p className="text-xs text-success flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          +12.5% vs mês anterior
        </p>
      </div>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
        <DollarSign className="w-6 h-6 text-primary" />
      </div>
    </div>
  </CardContent>
</Card>
```

### Background Pattern

```tsx
{/* Grid pattern de fundo */}
<div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]" />
```

### Lista de Transações

```tsx
<div className="space-y-4">
  {transactions.map((t) => (
    <div key={t.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium">{t.description}</p>
          <p className="text-sm text-muted-foreground">{t.date}</p>
        </div>
      </div>
      <p className={cn(
        "text-lg font-semibold",
        t.type === 'income' ? "text-success" : "text-destructive"
      )}>
        {t.type === 'income' ? '+' : '-'} R$ {t.amount}
      </p>
    </div>
  ))}
</div>
```

---

## 🔧 Ferramentas e Recursos

### Bibliotecas Principais

- **React**: Framework UI
- **Tailwind CSS**: Utility-first CSS
- **Radix UI**: Componentes acessíveis headless
- **Lucide React**: Ícones SVG
- **class-variance-authority**: Variantes de componentes
- **clsx/tailwind-merge**: Composição de classes CSS

### Arquivos de Referência

- [src/index.css](src/index.css) - Definição do design system (CSS variables)
- [src/components/ui/](src/components/ui/) - Componentes UI base
- [src/lib/utils.ts](src/lib/utils.ts) - Utilitário `cn()` para classes

### Links Úteis

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/docs/primitives)
- [Lucide Icons](https://lucide.dev/icons)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 📝 Notas de Atualização

### Versão 1.0 (Atual)

- Design system completo com modo dark
- 22 componentes UI prontos para uso
- Otimizações de performance mobile
- Sistema de cores HSL totalmente customizável
- Padrões de gradientes e efeitos visuais
- Suporte completo a acessibilidade (WCAG AA)

---

## 🤝 Contribuindo

Ao adicionar novos componentes ou padrões ao design system:

1. Documente no arquivo apropriado
2. Adicione exemplos de código
3. Teste em light e dark mode
4. Verifique acessibilidade
5. Otimize para mobile
6. Atualize este documento

---

**Última atualização**: 2025-11-20
**Mantido por**: Equipe Vault
