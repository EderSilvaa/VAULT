# Setup Guide - Vault Caixa Alerta

## Guia Completo de Configuração do Backend

### Passo 1: Criar Projeto no Supabase

1. **Acesse** [https://supabase.com](https://supabase.com)
2. **Faça login** ou crie uma conta gratuita
3. **Clique em "New Project"**
4. **Preencha os dados:**
   - Nome: `vault-caixa-alerta`
   - Database Password: (escolha uma senha forte)
   - Region: `South America (São Paulo)` ou mais próxima
   - Plan: Free (para começar)

5. **Aguarde** ~2 minutos para o projeto ser criado

---

### Passo 2: Executar o Schema SQL

1. **No painel do Supabase**, vá em: **SQL Editor** (menu lateral esquerdo)

2. **Clique em "New Query"**

3. **Copie e cole TODO o conteúdo** do arquivo `supabase/schema.sql`

4. **Clique em "Run"** (ou pressione Ctrl+Enter)

5. **Verifique** se todas as tabelas foram criadas:
   - Vá em **Database** → **Tables**
   - Você deve ver: `profiles`, `transactions`, `projections`, `financial_goals`, `ai_insights`

---

### Passo 3: Configurar Variáveis de Ambiente

1. **No painel do Supabase**, vá em **Settings** → **API**

2. **Copie as credenciais:**
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **anon public** key (uma string longa começando com `eyJ...`)

3. **Abra o arquivo** `.env` na raiz do projeto

4. **Substitua** as credenciais:

```env
VITE_SUPABASE_URL=https://sua-url-aqui.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

⚠️ **IMPORTANTE:** O `.env` já está no `.gitignore` - NUNCA faça commit dele!

---

### Passo 4: Configurar Autenticação no Supabase

1. **No Supabase**, vá em **Authentication** → **Providers**

2. **Configure Email Auth:**
   - Email (já deve estar habilitado por padrão)
   - Marque: "Enable email confirmations" (opcional para desenvolvimento)

3. **Configure Redirect URLs:**
   - Vá em **Authentication** → **URL Configuration**
   - Adicione: `http://localhost:8080/**`
   - Para produção, adicione sua URL real depois

---

### Passo 5: Testar a Conexão

1. **Inicie o servidor de desenvolvimento:**

```bash
npm run dev
```

2. **Acesse:** [http://localhost:8080](http://localhost:8080)

3. **Teste o fluxo:**
   - Clique em "Começar Agora"
   - Vá até a página de Signup
   - Crie uma conta de teste
   - Verifique se o email foi enviado (olhe no Supabase Authentication → Users)

---

## Estrutura do Projeto Atualizada

```
vault-caixa-alerta/
├── supabase/
│   └── schema.sql              # Schema do banco de dados
│
├── src/
│   ├── components/
│   │   ├── ProtectedRoute.tsx  # Proteção de rotas
│   │   └── ui/                 # Componentes UI
│   │
│   ├── hooks/
│   │   ├── useAuth.ts          # Hook de autenticação
│   │   ├── useTransactions.ts  # Hook de transações
│   │   ├── useProjections.ts   # Hook de projeções
│   │   └── useFinancialGoals.ts # Hook de metas
│   │
│   ├── services/
│   │   ├── auth.service.ts         # Serviço de auth
│   │   ├── transactions.service.ts # Serviço de transações
│   │   ├── goals.service.ts        # Serviço de metas
│   │   └── projections.service.ts  # Serviço de projeções
│   │
│   ├── types/
│   │   ├── database.ts         # Tipos do Supabase
│   │   └── index.ts            # Tipos da aplicação
│   │
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase
│   │   └── validations.ts      # Schemas Zod
│   │
│   ├── pages/
│   │   ├── Login.tsx           # Página de login (NOVA)
│   │   ├── Signup.tsx          # Página de cadastro
│   │   ├── Dashboard.tsx       # Dashboard (PRECISA REFATORAR)
│   │   └── ...
│   │
│   └── App.tsx                 # App com rotas protegidas
│
├── .env                        # Variáveis de ambiente (não commitado)
├── .env.example                # Exemplo de .env
└── SETUP.md                    # Este arquivo
```

---

## Próximos Passos

### 1. Refatorar o Dashboard (PRIORIDADE MÁXIMA)

O Dashboard atual ainda usa dados mockados. Precisamos:

- [ ] Substituir todos os `useState` locais pelos hooks reais
- [ ] Usar `useAuth()` para pegar o usuário atual
- [ ] Usar `useTransactions()` para transações reais
- [ ] Usar `useProjections()` para projeções calculadas
- [ ] Usar `useFinancialGoals()` para metas reais
- [ ] Remover todos os dados hardcoded

**Arquivo:** `src/pages/Dashboard.tsx` (987 linhas - precisa refatorar!)

### 2. Atualizar Página de Signup

Integrar a página de signup existente com o hook `useAuth()`:

- [ ] Importar `useAuth` hook
- [ ] Usar `signup()` function
- [ ] Adicionar validação com Zod
- [ ] Redirecionar para login após signup

### 3. Criar Seed Data (Opcional)

Para testar, você pode adicionar dados de exemplo:

```sql
-- Execute no SQL Editor do Supabase
-- Substitua 'SEU-USER-ID' pelo ID do usuário criado

-- Transações de exemplo
INSERT INTO transactions (user_id, type, amount, description, category, date)
VALUES
  ('SEU-USER-ID', 'income', 2500, 'Venda Cliente XYZ', 'Vendas', NOW() - INTERVAL '1 day'),
  ('SEU-USER-ID', 'expense', 850, 'Fornecedor ABC', 'Fornecedores', NOW() - INTERVAL '2 days'),
  ('SEU-USER-ID', 'income', 1200, 'Venda Produto', 'Vendas', NOW() - INTERVAL '3 days'),
  ('SEU-USER-ID', 'expense', 3000, 'Aluguel', 'Fixo', NOW() - INTERVAL '5 days');

-- Metas financeiras
INSERT INTO financial_goals (user_id, title, target_amount, current_amount)
VALUES
  ('SEU-USER-ID', 'Reserva de Emergência', 15000, 8500),
  ('SEU-USER-ID', 'Expansão do Negócio', 30000, 12000),
  ('SEU-USER-ID', 'Quitação de Dívidas', 10000, 7500);
```

### 4. Implementar Features Avançadas

Depois do básico funcionar:

- [ ] Exportação de relatórios (PDF)
- [ ] Gráficos de categoria
- [ ] Filtros de data avançados
- [ ] Notificações push
- [ ] Integração Open Banking
- [ ] WhatsApp alerts

---

## Troubleshooting

### Erro: "Missing Supabase environment variables"

**Solução:** Verifique se o `.env` está correto e reinicie o servidor (`npm run dev`)

### Erro: "relation 'profiles' does not exist"

**Solução:** Execute o `schema.sql` no SQL Editor do Supabase

### Erro: "Invalid login credentials"

**Solução:** Verifique se o email foi confirmado. Para dev, desabilite confirmação de email em:
Supabase → Authentication → Email Auth Settings → "Enable email confirmations" (OFF)

### Dados não aparecem no Dashboard

**Solução:** O Dashboard ainda usa dados mockados. Siga o "Passo 1" dos Próximos Passos.

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

---

## Suporte

Se encontrar problemas:

1. Verifique os logs do navegador (F12 → Console)
2. Verifique os logs do Supabase (Dashboard → Logs)
3. Teste a conexão com Supabase manualmente

---

## Checklist de Setup Completo

- [ ] Projeto criado no Supabase
- [ ] Schema SQL executado
- [ ] `.env` configurado com credenciais corretas
- [ ] Autenticação configurada
- [ ] Servidor de dev rodando (`npm run dev`)
- [ ] Conta de teste criada com sucesso
- [ ] Login funciona
- [ ] Dashboard protegido por autenticação
- [ ] **PRÓXIMO:** Refatorar Dashboard para usar dados reais

---

**Pronto!** Agora você tem uma base sólida. O próximo passo crítico é refatorar o Dashboard para integrar com os dados reais.
