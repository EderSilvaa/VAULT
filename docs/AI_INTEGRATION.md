# Integração OpenAI GPT-4o - Vault

## Visão Geral

O Vault agora possui análise financeira preditiva alimentada por **GPT-4o**, o modelo mais avançado da OpenAI para raciocínio matemático e análise de dados.

## Funcionalidades de IA

### 1. Insights Financeiros Automáticos 🧠

O GPT-4o analisa suas transações e gera insights personalizados:

- **Detecção de Padrões**: Identifica tendências de gastos e receitas
- **Alertas Proativos**: Avisa sobre possíveis problemas financeiros
- **Oportunidades**: Sugere formas de economizar ou otimizar recursos
- **Ações Práticas**: Recomendações específicas para cada situação

**Severidades dos Insights:**
- 🔴 **Alta (high)**: Requer ação imediata
- 🟡 **Média (medium)**: Atenção necessária
- 🟢 **Baixa (low)**: Informativo/positivo

### 2. Previsão de Saldo 🔮

Predição matemática do seu saldo futuro:

- **Horizonte**: 7, 15, ou 30 dias
- **Confiança**: Nível de certeza da previsão (0-100%)
- **Tendência**: Crescente, decrescente ou estável
- **Fatores**: Lista dos elementos considerados na análise

**Como funciona:**
```typescript
const prediction = await aiService.predictBalance(userId, 30)
// Retorna:
{
  predicted_balance: 15420.50,
  days_ahead: 30,
  confidence: 0.85,
  trend: "stable",
  factors: ["Receita recorrente detectada", "Padrão de gastos constante"]
}
```

### 3. Detecção de Anomalias 🚨

Identifica transações incomuns que podem indicar:

- **Fraude**: Cobranças suspeitas
- **Duplicatas**: Pagamentos em duplicidade
- **Valores Atípicos**: Gastos muito acima da média
- **Erros**: Possíveis lançamentos incorretos

**Exemplo de Anomalia:**
```json
{
  "transaction_description": "PIX - Loja XYZ",
  "amount": 2500.00,
  "date": "2025-01-10",
  "reason": "Valor 300% acima da média de gastos nesta categoria",
  "severity": "high"
}
```

### 4. Análise de Padrões de Gastos 📊

Analisa cada categoria de despesa:

- **Média Mensal**: Gasto médio por categoria
- **Tendência**: Aumentando, diminuindo ou estável
- **Insights**: Contexto e recomendações específicas
- **Comparação**: Como seus gastos se comparam ao histórico

## Como Usar

### No Dashboard

1. **Card "Insights IA"** (lateral direito)
   - Mostra preview de 3 insights principais
   - Atualiza automaticamente após análise

2. **Botão "Ver Análise Completa"**
   - Abre modal com análise detalhada
   - Executa todas as funcionalidades de IA em paralelo
   - Mostra insights, previsões, anomalias e padrões

3. **Botão "Análise Detalhada IA"** (Ações Rápidas)
   - Acesso rápido ao modal completo

### Primeira Análise

```typescript
// Clique em "Ver Análise Completa" no Dashboard
// O sistema irá:
1. Buscar suas transações no Supabase
2. Enviar dados para GPT-4o
3. Processar 4 análises em paralelo:
   - Insights financeiros
   - Previsão de saldo (30 dias)
   - Detecção de anomalias
   - Padrões de gastos
4. Salvar insights no banco de dados
5. Exibir resultados no modal
```

## Arquitetura Técnica

### Serviços

**`src/services/ai.service.ts`**
- Cliente OpenAI configurado para browser
- Funções para cada tipo de análise
- Prompt engineering em português
- Salvamento automático de insights

**`src/hooks/useAI.ts`**
- React hook para gerenciar estado da IA
- Loading/error states
- Funções para análises individuais ou completas

### Fluxo de Dados

```
Dashboard → useAI hook → ai.service → GPT-4o API
                                         ↓
                                    Análise
                                         ↓
                                    JSON Response
                                         ↓
                                    Supabase (salva)
                                         ↓
                                    Dashboard (exibe)
```

### Segurança

- ✅ API key hardcoded no `vite.config.ts` (desenvolvimento)
- ✅ `dangerouslyAllowBrowser: true` (frontend temporário)
- ⚠️ **PRODUÇÃO**: Mover para backend/serverless functions
- ✅ Nunca expor API key no código fonte público

## Custos Estimados

### Modelo: GPT-4o

- **Input**: $2.50 por 1M tokens
- **Output**: $10.00 por 1M tokens

### Por Análise Completa

- **Transações**: ~100-200 tokens
- **Prompts**: ~500 tokens
- **Resposta**: ~800 tokens
- **Total**: ~1.500 tokens = ~$0.015 (R$ 0,08)

### Uso Mensal Estimado

- **10 análises/dia**: ~$4.50/mês
- **50 análises/dia**: ~$22.50/mês
- **100 análises/dia**: ~$45.00/mês

## Configuração

### 1. Obter API Key

Siga o guia em [OPENAI_SETUP.md](./OPENAI_SETUP.md)

### 2. Configurar Variáveis

**`.env.local`:**
```env
VITE_OPENAI_API_KEY=sk-proj-sua-api-key-aqui
```

**`vite.config.ts`:**
```typescript
define: {
  'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify('sk-proj-...'),
}
```

### 3. Verificar Configuração

```typescript
// No Dashboard, verifique:
const { isConfigured } = useAI()
console.log('IA configurada:', isConfigured) // deve ser true
```

## Prompt Engineering

Os prompts foram otimizados para o contexto brasileiro:

### Insights Financeiros

```typescript
Você é um analista financeiro especializado em finanças pessoais brasileiras.
Analise as transações e forneça 5 insights acionáveis em português.

Categorias: spending, income, balance, savings, risk, opportunity
Severidades: high, medium, low

Foco em:
- Padrões de comportamento financeiro
- Oportunidades de economia
- Riscos de fluxo de caixa
- Crescimento sustentável
```

### Previsão de Saldo

```typescript
Analise as transações e faça uma previsão matemática do saldo.

Considere:
- Receitas recorrentes
- Despesas fixas e variáveis
- Tendências sazonais
- Eventos atípicos

Retorne JSON com previsão e nível de confiança.
```

### Detecção de Anomalias

```typescript
Identifique transações anômalas ou suspeitas.

Busque por:
- Valores muito acima/abaixo da média
- Transações duplicadas
- Padrões incomuns
- Possíveis fraudes

Use temperatura 0.2 para precisão máxima.
```

## Troubleshooting

### Erro: "Invalid API key"

✅ Verifique se a API key está correta em `.env.local` e `vite.config.ts`
✅ Reinicie o servidor: `Ctrl+C` → `npm run dev`
✅ Verifique se a key começa com `sk-proj-`

### Erro: "Rate limit exceeded"

✅ Aguarde 1 minuto
✅ Configure limites no dashboard da OpenAI
✅ Use debounce para evitar múltiplas chamadas

### Erro: "Insufficient quota"

✅ Adicione créditos na OpenAI
✅ Verifique billing: https://platform.openai.com/account/billing

### Insights não aparecem

✅ Verifique se há transações no banco
✅ Veja console do browser para erros
✅ Teste `isConfigured` retorna `true`

## Próximos Passos

### Curto Prazo
- [ ] Cache de insights (evitar análises duplicadas)
- [ ] Análise incremental (apenas novas transações)
- [ ] Rate limiting no frontend

### Médio Prazo
- [ ] Backend API para IA (segurança)
- [ ] Webhooks para análise automática
- [ ] Alertas por email/push

### Longo Prazo
- [ ] Fine-tuning do modelo com dados brasileiros
- [ ] Recomendações de investimentos
- [ ] Comparação com outros usuários (anonimizado)
- [ ] Assistente conversacional

## Monitoramento

### Dashboard OpenAI
https://platform.openai.com/usage

Monitore:
- Uso diário de tokens
- Custos acumulados
- Erros de API
- Latência

### Logs do Sistema

```bash
# Veja logs da IA no console do browser
[useAI] Generating insights...
[useAI] Generated 5 insights
[ai.service] Predicting balance for 30 days...
[ai.service] Balance prediction: {predicted_balance: 15420.50}
```

## Contato

Dúvidas sobre a integração? Consulte a documentação da OpenAI:
https://platform.openai.com/docs
