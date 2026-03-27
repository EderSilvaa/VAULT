# Guia: Como Obter a API Key do OpenAI GPT-4o

## Passo 1: Criar Conta na OpenAI (5 minutos)

1. **Acesse**: https://platform.openai.com/signup
2. **Cadastre-se** com:
   - Email
   - OU entre com Google/Microsoft/Apple
3. **Confirme seu email** (verifique a caixa de entrada)
4. **Adicione número de telefone** para verificação

## Passo 2: Adicionar Método de Pagamento

⚠️ **IMPORTANTE**: A OpenAI requer cartão de crédito, mas você pode definir limites de gasto

1. **Acesse**: https://platform.openai.com/account/billing/overview
2. Clique em **"Add payment method"**
3. Adicione seu cartão de crédito
4. **Defina um limite de gasto** (ex: $10/mês)

### 💰 Custos do GPT-4o:
- **Input**: $2.50 por 1M tokens (~750.000 palavras)
- **Output**: $10.00 por 1M tokens
- **Estimativa**: 1000 análises = ~$0.50-$2.00

## Passo 3: Criar API Key

1. **Acesse**: https://platform.openai.com/api-keys
2. Clique em **"Create new secret key"**
3. **Dê um nome**: "Vault AI"
4. **COPIE A KEY AGORA!** (só aparece uma vez)
   - Formato: `sk-proj-...` (começa com sk-)

## Passo 4: Adicionar no Projeto

1. **Abra** o arquivo `.env.local` no VS Code
2. **Substitua** a linha:

**ANTES:**
```env
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

**DEPOIS:**
```env
VITE_OPENAI_API_KEY=sk-proj-sua-api-key-aqui
```

3. **Salve** o arquivo (Ctrl+S)

## Passo 5: Reiniciar o Servidor

1. **No terminal**, pressione **Ctrl+C** para parar o servidor
2. **Execute** novamente:
   ```bash
   npm run dev
   ```

## Passo 6: Testar

Acesse http://localhost:8080 e você deve ver insights de IA sendo gerados!

## ⚙️ Configurar Limites de Gasto (RECOMENDADO)

1. **Acesse**: https://platform.openai.com/account/limits
2. **Defina**:
   - **Soft limit**: $5/mês (recebe email de aviso)
   - **Hard limit**: $10/mês (API para de funcionar)

## 🔒 Segurança

- ⚠️ **NUNCA** compartilhe sua API key
- ⚠️ **NUNCA** faça commit da API key no GitHub
- ✅ O arquivo `.env.local` já está no `.gitignore`
- ✅ Use variáveis de ambiente em produção

## 📊 Monitorar Uso

- **Dashboard**: https://platform.openai.com/usage
- Veja custo em tempo real
- Receba alertas por email

## 🆓 Créditos Gratuitos

- Novos usuários ganham **$5 de crédito grátis**
- Válido por 3 meses
- Suficiente para testar o Vault!

## ❓ Troubleshooting

### Erro: "Invalid API key"
- ✅ Verifique se copiou a key completa (começa com `sk-`)
- ✅ Reinicie o servidor (`Ctrl+C` e `npm run dev`)

### Erro: "Rate limit exceeded"
- ⚠️ Atingiu o limite de requisições
- ✅ Aguarde alguns minutos
- ✅ Aumente o rate limit no dashboard

### Erro: "Insufficient quota"
- ⚠️ Créditos acabaram
- ✅ Adicione método de pagamento
- ✅ Verifique billing: https://platform.openai.com/account/billing

## 🎯 Funcionalidades do Vault com IA

Com a API configurada, você terá:

1. **Insights Automáticos** 🧠
   - "Você gastou 30% mais este mês"
   - "Seu saldo ficará negativo em 5 dias"

2. **Previsão de Saldo** 🔮
   - Saldo previsto para 7, 15, 30 dias
   - Nível de confiança da previsão

3. **Detecção de Anomalias** 🚨
   - Gastos incomuns
   - Possíveis fraudes
   - Transações duplicadas

4. **Análise de Padrões** 📊
   - Categorias que mais crescem
   - Oportunidades de economia
   - Comparação com meses anteriores

5. **Recomendações Personalizadas** 💡
   - Sugestões específicas para você
   - Metas realistas
   - Planos de ação

## 🚀 Próximos Passos

Depois de configurar:
1. Teste gerando insights no Dashboard
2. Veja a previsão de saldo
3. Configure alertas automáticos
