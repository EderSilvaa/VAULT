# Instruções para Executar a Migração de Consentimento

## Passo 1: Acessar Supabase SQL Editor

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto Vault Caixa Alerta
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

## Passo 2: Executar a Migração

1. Copie o conteúdo do arquivo `supabase/migrations/003_consent_tracking.sql`
2. Cole no editor SQL
3. Clique em **RUN** ou pressione `Ctrl+Enter`

## Passo 3: Verificar a Migração

Execute a seguinte query para verificar se os campos foram adicionados:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bank_connections'
  AND column_name IN ('consent_given_at', 'consent_expires_at', 'consent_ip_address');
```

Você deve ver os três campos listados:
- `consent_given_at` (timestamp with time zone, nullable)
- `consent_expires_at` (timestamp with time zone, nullable)
- `consent_ip_address` (text, nullable)

## Passo 4: Verificar a View de Consents Expirando

Execute a query abaixo para verificar se a view foi criada:

```sql
SELECT * FROM expiring_consents;
```

Esta view deve retornar todas as conexões bancárias cujo consentimento expira nos próximos 30 dias.

## Passo 5: Verificar o Trigger

Execute a query abaixo para verificar se o trigger foi criado:

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_set_consent_expiration';
```

O trigger deve estar ativo e configurado para disparar em INSERT/UPDATE na tabela `bank_connections`.

## O que essa Migração Faz?

### 1. Adiciona Campos de Consentimento
- **consent_given_at**: Data e hora em que o usuário deu consentimento
- **consent_expires_at**: Data de expiração do consentimento (12 meses após consentimento)
- **consent_ip_address**: Endereço IP de onde o consentimento foi dado (auditoria)

### 2. Função de Auto-Cálculo de Expiração
Quando `consent_given_at` é definido, automaticamente calcula `consent_expires_at` como 12 meses depois (conforme Open Finance Brasil).

### 3. View para Consents Expirando
Facilita encontrar conexões que precisam renovar consentimento (dentro de 30 dias da expiração).

### 4. Índice para Performance
Cria índice em `consent_expires_at` para queries rápidas.

## Compliance LGPD e Open Finance Brasil

Esta migração garante:
- ✅ Rastreamento explícito de consentimento do usuário
- ✅ Auditoria com IP address e timestamp
- ✅ Expiração automática após 12 meses (Open Finance Brasil)
- ✅ View para alertar usuários sobre renovação de consentimento
- ✅ Conformidade com LGPD Art. 37 (registro de consentimento)

## Próximos Passos Após a Migração

1. Teste o fluxo de consentimento no Dashboard
2. Conecte um banco e verifique se os dados de consentimento são salvos
3. Verifique na tabela `bank_connections` se os campos foram populados
4. Implemente notificações para consents expirando (futuro)
