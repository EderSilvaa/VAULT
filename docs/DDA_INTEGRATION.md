# 💳 DDA (Débito Direto Autorizado) - Integração Vault

## 🎯 O Que É DDA?

**DDA** = Débito Direto Autorizado

É um sistema **FEBRABAN** (desde 2009) que apresenta **boletos eletrônicos** diretamente na conta bancária do cliente, sem precisar do papel físico.

### Como Funciona:

```
Fornecedor emite boleto
        ↓
Boleto vai para sistema DDA
        ↓
Banco detecta CPF/CNPJ
        ↓
Boleto aparece no app/internet banking
        ↓
Cliente visualiza e autoriza pagamento
```

---

## 🔥 Por Que DDA É IMPORTANTE para o Vault?

Seu sócio está **100% CERTO**! DDA é complementar ao Open Finance e resolve um problema específico:

### 🎯 Problema que DDA Resolve:

**Empresas brasileiras gastam HORAS:**
- Buscando boletos em emails
- Digitando códigos de barra
- Perdendo vencimentos
- Pagando juros por atraso

### ✅ Solução com DDA:

**Vault + DDA:**
- Puxa **TODOS os boletos** automaticamente
- Centraliza em um só lugar
- Alerta vencimentos próximos
- Permite pagar direto do app
- **Integra com fluxo de caixa** (despesas previstas)

---

## 📊 DDA vs Open Finance - Comparação

| Aspecto | Open Finance | DDA |
|---------|-------------|-----|
| **O que faz** | Sincroniza transações bancárias já realizadas | Apresenta boletos a pagar |
| **Tipo de dado** | Histórico de receitas/despesas | Contas a pagar futuras |
| **Direção** | PASSADO → Presente | Presente → FUTURO |
| **Uso no Vault** | Preencher transações passadas | Prever despesas futuras |
| **Benefício** | Projeção baseada em histórico | Alertas de vencimentos |
| **Regulação** | Banco Central (Open Finance) | FEBRABAN (DDA) |
| **Cobertura** | Todos os bancos | Todos os bancos |
| **Custo** | Pay-per-call | Pay-per-call |

### 🎯 Juntos = COMBO PERFEITO!

```
Open Finance → "O que já aconteceu" (transações passadas)
     +
DDA → "O que vai acontecer" (boletos a vencer)
     =
PREVISÃO COMPLETA DE FLUXO DE CAIXA! 🚀
```

---

## 💡 Como DDA Turbina o Vault

### Use Case Real:

**Empresa:** Padaria do João (MEI)

**Sem DDA:**
- João recebe 15 boletos/mês por email
- Fornecedores, aluguel, energia, água, internet...
- Ele anota tudo manualmente no Vault
- Esquece um boleto → paga juros
- Fluxo de caixa sempre desatualizado

**Com DDA:**
- Vault conecta no banco via DDA
- Puxa **automaticamente** os 15 boletos
- Mostra no Dashboard: "Você tem R$ 8.500 em boletos vencendo esta semana"
- Alerta: "Em 3 dias seu caixa não terá saldo para pagar tudo!"
- João antecipa recebíveis ou renegocia
- **EVITA JUROS + MELHORA CASH FLOW**

---

## 🏗️ Arquitetura DDA + Open Finance

### Fluxo Completo no Vault:

```
┌─────────────────────────────────────────────┐
│         USUÁRIO CONECTA BANCO               │
└──────────────┬──────────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ↓                 ↓
┌──────────┐      ┌──────────┐
│  PLUGGY  │      │   DDA    │
│   API    │      │   API    │
└────┬─────┘      └────┬─────┘
     │                 │
     │ Transações      │ Boletos
     │ Passadas        │ Futuros
     │                 │
     ↓                 ↓
┌──────────────────────────────┐
│    VAULT BACKEND            │
│   (Supabase Functions)       │
└──────────┬───────────────────┘
           │
           │ Salva tudo
           ↓
     ┌──────────┐
     │ Supabase │
     │ Postgres │
     └────┬─────┘
          │
          ↓
┌─────────────────────────────┐
│  DASHBOARD VAULT           │
├─────────────────────────────┤
│ ✅ Transações (Pluggy)      │
│ ✅ Boletos a Pagar (DDA)    │
│ ✅ Projeção Completa        │
│ ✅ Alertas Inteligentes     │
└─────────────────────────────┘
```

---

## 🛠️ Provedores de API DDA

### 1️⃣ **TecnoSpeed** (RECOMENDADO)

**Website:** https://tecnospeed.com.br

**O que oferece:**
- ✅ API DDA completa
- ✅ Buscador de boletos
- ✅ Integração bancária
- ✅ Pagamento de boletos
- ✅ Extrato unificado

**Features:**
- Busca automática de boletos por CNPJ/CPF
- Categorização de boletos
- Agendamento de pagamentos
- Webhooks para novos boletos
- Sandbox para testes

**Pricing:**
- **Modelo:** Pay-per-use
- **Custo estimado:** R$ 0,10 - R$ 0,30 por boleto consultado
- **Free tier:** Sandbox grátis

**Docs:** https://documentacao.tecnospeed.com.br

---

### 2️⃣ **Dock (Banking as a Service)**

**Website:** https://dock.tech

**O que oferece:**
- ✅ DDA integrado
- ✅ Banking APIs
- ✅ Pay-as-you-go
- ✅ Suporte regulatório

**Features:**
- API RESTful
- Consulta de boletos
- Pagamento integrado
- Dashboard de gestão

**Pricing:**
- **Consulta:** Sob consulta
- **Modelo:** Flexível

---

### 3️⃣ **Acesso Direto aos Bancos**

**Bancos com API DDA própria:**
- **Itaú:** API DDA no Dev Portal
- **Santander:** DDA Empresas
- **Bradesco:** API DDA
- **Banco do Brasil:** DDA API

**Prós:**
- ✅ Sem intermediário
- ✅ Algumas APIs gratuitas

**Contras:**
- ❌ Integrar banco por banco
- ❌ Manutenção complexa
- ❌ APIs diferentes
- ❌ Não viável para MVP

---

### 4️⃣ **Pluggy (NOVIDADE!)**

**ATENÇÃO:** Pluggy também oferece DDA!

**Website:** https://pluggy.ai

Descobri que o Pluggy, além de Open Finance, **TAMBÉM TEM DDA** na mesma API!

**Vantagem:**
- ✅ **1 integração = Open Finance + DDA**
- ✅ Menos fornecedores
- ✅ Menos custo
- ✅ Mesma SDK
- ✅ Dashboard único

**Isso é PERFEITO para o Vault!** 🎉

---

## 💻 Implementação DDA no Vault

### Fase 1: Setup com TecnoSpeed (ou Pluggy)

#### 1.1 Criar Conta

```bash
# TecnoSpeed
1. Acesse: https://tecnospeed.com.br
2. Crie conta developer
3. Gere API Key
4. Acesse sandbox

# OU

# Pluggy (se tiver DDA)
1. Mesmo dashboard do Open Finance
2. Habilitar feature DDA
3. Usar mesma API Key
```

#### 1.2 Instalar SDK

```bash
npm install tecnospeed-sdk
# OU usar Pluggy SDK que já vamos instalar
```

#### 1.3 Configurar .env

```env
# .env
TECNOSPEED_API_KEY=your_api_key
TECNOSPEED_WEBHOOK_URL=https://seu-projeto.supabase.co/functions/v1/dda-webhook
```

---

### Fase 2: Criar Serviço DDA

```typescript
// src/services/dda.service.ts
import { supabase } from '@/lib/supabase'

export const ddaService = {
  /**
   * Buscar boletos pendentes por CNPJ/CPF
   */
  async fetchBoletos(document: string) {
    // Chamar API TecnoSpeed ou Pluggy
    const response = await fetch('https://api.tecnospeed.com.br/dda/boletos', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.TECNOSPEED_API_KEY}`,
        'Content-Type': 'application/json',
      },
      params: {
        documento: document,
        status: 'pending',
      },
    })

    const boletos = await response.json()
    return boletos
  },

  /**
   * Sincronizar boletos com banco de dados
   */
  async syncBoletos(userId: string, document: string) {
    const boletos = await this.fetchBoletos(document)

    // Salvar no Supabase
    const { data, error } = await supabase
      .from('bills') // Nova tabela para boletos
      .upsert(
        boletos.map(b => ({
          user_id: userId,
          external_id: b.id,
          type: 'bill',
          amount: b.valor,
          description: b.beneficiario,
          barcode: b.codigoBarras,
          due_date: b.vencimento,
          status: b.status,
          category: this.categorizeBill(b.beneficiario),
        })),
        { onConflict: 'external_id' }
      )

    return { success: !error, count: boletos.length }
  },

  /**
   * Categorizar boleto automaticamente
   */
  categorizeBill(beneficiary: string): string {
    const categories: Record<string, string> = {
      'CPFL': 'Energia',
      'SABESP': 'Água',
      'VIVO': 'Telefone/Internet',
      'CLARO': 'Telefone/Internet',
      'TIM': 'Telefone/Internet',
      'ALUGUEL': 'Aluguel',
      'IPTU': 'Impostos',
    }

    for (const [keyword, category] of Object.entries(categories)) {
      if (beneficiary.toUpperCase().includes(keyword)) {
        return category
      }
    }

    return 'Outros'
  },

  /**
   * Pagar boleto
   */
  async payBill(billId: string, bankAccount: string) {
    // Integrar com API de pagamento
    // TecnoSpeed ou usar Pix
    const response = await fetch('https://api.tecnospeed.com.br/dda/pagar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TECNOSPEED_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        boletoId: billId,
        conta: bankAccount,
      }),
    })

    return response.json()
  },
}
```

---

### Fase 3: Atualizar Schema do Banco

```sql
-- supabase/schema-dda.sql

-- Tabela de boletos (bills)
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT UNIQUE,
  type TEXT DEFAULT 'bill',
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  barcode TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_bills_status ON bills(status);

-- RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bills"
  ON bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills"
  ON bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills"
  ON bills FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### Fase 4: Criar Hook React Query

```typescript
// src/hooks/useBills.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ddaService } from '@/services/dda.service'
import { useToast } from './use-toast'

export function useBills(userId: string | undefined) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Buscar boletos pendentes
  const {
    data: bills = [],
    isLoading,
  } = useQuery({
    queryKey: ['bills', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })

      return data || []
    },
    enabled: !!userId,
  })

  // Sincronizar boletos
  const syncBills = useMutation({
    mutationFn: async (document: string) => {
      return ddaService.syncBoletos(userId!, document)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bills', userId] })

      toast({
        title: 'Boletos sincronizados!',
        description: `${result.count} boletos encontrados.`,
      })
    },
  })

  // Pagar boleto
  const payBill = useMutation({
    mutationFn: async ({ billId, account }: { billId: string; account: string }) => {
      return ddaService.payBill(billId, account)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', userId] })

      toast({
        title: 'Boleto pago!',
        description: 'Pagamento realizado com sucesso.',
      })
    },
  })

  // Calcular total a pagar
  const totalToPay = bills.reduce((sum, bill) => sum + Number(bill.amount), 0)

  // Boletos vencendo em 7 dias
  const upcomingBills = bills.filter(bill => {
    const daysUntilDue = Math.ceil(
      (new Date(bill.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilDue <= 7 && daysUntilDue >= 0
  })

  return {
    bills,
    totalToPay,
    upcomingBills,
    isLoading,
    syncBills: syncBills.mutate,
    payBill: payBill.mutate,
    isSyncing: syncBills.isPending,
    isPaying: payBill.isPending,
  }
}
```

---

### Fase 5: Componente de Boletos no Dashboard

```typescript
// src/components/BillsWidget.tsx
import { useBills } from '@/hooks/useBills'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, FileText, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function BillsWidget() {
  const { user } = useAuth()
  const { bills, totalToPay, upcomingBills, syncBills, isSyncing } = useBills(user?.id)

  return (
    <Card className="border-0 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Boletos a Pagar (DDA)</CardTitle>
              <p className="text-xs text-muted-foreground">
                {bills.length} boletos • Total: R$ {totalToPay.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => syncBills(user?.companyDocument || user?.email)}
            disabled={isSyncing}
          >
            {isSyncing ? 'Sincronizando...' : 'Sincronizar DDA'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Alerta de boletos vencendo */}
        {upcomingBills.length > 0 && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm font-bold text-destructive">
                  {upcomingBills.length} boleto(s) vencendo em 7 dias
                </p>
                <p className="text-xs text-muted-foreground">
                  Total: R$ {upcomingBills.reduce((sum, b) => sum + Number(b.amount), 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de boletos */}
        <div className="space-y-2">
          {bills.slice(0, 5).map(bill => {
            const daysUntilDue = Math.ceil(
              (new Date(bill.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            const isUrgent = daysUntilDue <= 3

            return (
              <div
                key={bill.id}
                className={`p-3 rounded-xl border transition-all hover:bg-background/60 ${
                  isUrgent ? 'border-destructive/30 bg-destructive/5' : 'border-border/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{bill.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className={`text-xs ${isUrgent ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                        Vence {format(new Date(bill.due_date), "dd 'de' MMMM", { locale: ptBR })}
                        {isUrgent && ` (${daysUntilDue} dia${daysUntilDue !== 1 ? 's' : ''}!)`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-warning">
                      R$ {Number(bill.amount).toLocaleString('pt-BR')}
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Pagar
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {bills.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum boleto pendente</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => syncBills(user?.companyDocument || user?.email)}
            >
              Sincronizar DDA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 💰 Análise de Custos DDA

### Cenário: 1.000 usuários

**Assumindo:**
- 1.000 empresas (MEI/Pequenas)
- Média de 10 boletos/mês por empresa
- Sincronização diária (30x/mês)

**Cálculo TecnoSpeed:**

```
Sincronizações mensais:
1.000 usuários × 30 dias = 30.000 consultas/mês
Custo: R$ 0,15 por consulta = R$ 4.500/mês

Boletos encontrados:
1.000 usuários × 10 boletos = 10.000 boletos/mês
(Geralmente incluso no custo de consulta)

TOTAL ESTIMADO: R$ 4.500/mês
```

**Receita para cobrir:**
- Cobrar R$ 29,90/mês
- 1.000 usuários = R$ 29.900/mês
- Custo DDA: R$ 4.500 (15% da receita)
- **Margem boa!** ✅

---

## 📋 Roadmap DDA

### Sprint 1: MVP DDA (1 semana)

- [ ] Criar conta TecnoSpeed (ou verificar Pluggy)
- [ ] Implementar `dda.service.ts`
- [ ] Criar tabela `bills` no Supabase
- [ ] Testar sincronização em sandbox

### Sprint 2: UI de Boletos (1 semana)

- [ ] Criar `useBills()` hook
- [ ] Implementar `BillsWidget.tsx`
- [ ] Adicionar no Dashboard
- [ ] Alertas de vencimento

### Sprint 3: Integração com Fluxo de Caixa (1 semana)

- [ ] Incluir boletos nas projeções
- [ ] Dashboard consolidado (transações + boletos)
- [ ] Alertas inteligentes: "Não terá saldo para pagar X"

### Sprint 4: Pagamento de Boletos (2 semanas)

- [ ] Integrar API de pagamento
- [ ] Botão "Pagar Boleto"
- [ ] Confirmação de pagamento
- [ ] Atualização automática do status

---

## 🎯 Recomendação Final

### ✅ COMBO VENCEDOR:

**Pluggy (se tiver DDA integrado):**
- 1 integração = Open Finance + DDA
- Menos complexidade
- Custo otimizado

**OU**

**Pluggy (Open Finance) + TecnoSpeed (DDA):**
- Melhor dos dois mundos
- Provedores especializados
- Mais features

---

## 🚀 Próximos Passos

### HOJE:
1. ✅ Verificar se Pluggy tem DDA
   - Acesse: https://dashboard.pluggy.ai
   - Pergunte no suporte
   - Veja docs

2. ✅ Se não tiver, criar conta TecnoSpeed
   - https://tecnospeed.com.br
   - Testar sandbox DDA

### ESTA SEMANA:
- Implementar DDA em paralelo com Open Finance
- Criar tabela `bills`
- Sincronizar boletos de teste

### PRÓXIMO MÊS:
- Integrar ao Dashboard
- Alertas de vencimento
- Beta test com 10 empresas reais

---

## ✅ Checklist DDA

- [ ] Provedor escolhido (Pluggy ou TecnoSpeed)
- [ ] Conta criada
- [ ] API Key configurada
- [ ] Tabela `bills` criada
- [ ] Serviço DDA implementado
- [ ] Hook `useBills` criado
- [ ] Widget no Dashboard
- [ ] Sincronização funcionando
- [ ] Alertas configurados
- [ ] Integrado com projeções

---

**DDA + Open Finance = VAULT COMPLETO!** 🚀

Seu sócio mandou muito bem na sugestão. Com DDA, você tem:
- ✅ Passado (transações do Open Finance)
- ✅ Futuro (boletos do DDA)
- ✅ Presente (saldo atual)

= **PREVISÃO PERFEITA DE FLUXO DE CAIXA!**

Quer que eu te ajude a implementar? 💪
