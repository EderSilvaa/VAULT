# Correções do Sistema de Notificações Push

## Data: 2025-01-18

### Resumo

Foram corrigidos erros críticos que impediam a ativação das notificações push no sistema Vault.

## Problemas Encontrados e Soluções

### 1. Erro: "process is not defined"

**Localização:** `src/services/notification.service.ts:98`

**Causa:** Uso de `process.env.VITE_VAPID_PUBLIC_KEY` em contexto de navegador (Vite usa `import.meta.env`)

**Solução Aplicada:**
```typescript
// ANTES:
applicationServerKey: this.urlBase64ToUint8Array(
  process.env.VITE_VAPID_PUBLIC_KEY || ''
)

// DEPOIS:
const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

if (!vapidKey) {
  console.warn('VITE_VAPID_PUBLIC_KEY not configured. Push notifications will not work.');
  console.warn('Generate VAPID keys with: npx web-push generate-vapid-keys');
}

subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: vapidKey ? this.urlBase64ToUint8Array(vapidKey) : undefined
});
```

### 2. Erro: RPC `get_notification_preferences` não existe (404)

**Localização:** `src/services/notification.service.ts`

**Causa:** Chamada para função RPC que não existe no Supabase

**Solução Aplicada:**
```typescript
// ANTES:
const { data, error } = await supabase.rpc('get_notification_preferences', {
  p_user_id: userId
});

// DEPOIS:
const { data, error } = await supabase
  .from('notification_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();
```

### 3. Erro: RPC `save_notification_history` não existe (404)

**Localização:**
- `src/services/notification.service.ts`
- `src/services/notification-scheduler.service.ts` (5 ocorrências)

**Causa:** Chamada para função RPC que não existe no Supabase

**Solução Aplicada em notification.service.ts:**
```typescript
// ANTES:
const { error } = await supabase.rpc('save_notification_history', {
  p_user_id: userId,
  p_type: type,
  p_title: title,
  p_message: message,
  p_channel: 'push',
  p_data: data
});

// DEPOIS:
const { error } = await supabase
  .from('notification_history')
  .insert({
    user_id: userId,
    type: type,
    title: title,
    message: message,
    channel: 'push',
    data: data,
    status: 'pending'
  });
```

**Solução Aplicada em notification-scheduler.service.ts:**

Foram corrigidas 5 chamadas RPC em diferentes métodos:
- `sendDailyDigest()` - linha 236
- `sendWeeklySummary()` - linha 260
- `sendCashLowAlert()` - linha 283
- `sendGoalProgressAlert()` - linha 301
- `sendGoalDeadlineAlert()` - linha 319

Todas foram substituídas por inserts diretos na tabela `notification_history` com a estrutura:
```typescript
await supabase
  .from('notification_history')
  .insert({
    user_id: userId,
    type: 'tipo_da_notificacao',
    title: 'Título',
    message: 'Mensagem',
    channel: 'push',
    data: { ... },
    status: 'pending'
  });
```

## Arquivos Modificados

1. ✅ `src/services/notification.service.ts`
   - Correção de `process.env` para `import.meta.env`
   - Substituição de 2 chamadas RPC por queries diretas

2. ✅ `src/services/notification-scheduler.service.ts`
   - Substituição de 5 chamadas RPC por inserts diretos

3. ✅ `src/components/ui/switch.tsx`
   - Componente já existia (verificado)

## Status Atual

✅ **Compilação:** Sem erros
✅ **Dev Server:** Rodando normalmente
✅ **HMR:** Funcionando corretamente
✅ **Dependências:** @radix-ui/react-switch otimizado

## Próximos Passos para Uso em Produção

### 1. Gerar e Configurar Chaves VAPID

```bash
# Gerar chaves
npx web-push generate-vapid-keys

# Adicionar ao .env.local:
VITE_VAPID_PUBLIC_KEY=BNe... (chave pública)
VAPID_PRIVATE_KEY=Jz... (chave privada)
```

### 2. Executar Migration no Supabase

Executar o arquivo `supabase/migrations/20250118_notification_preferences.sql` no Supabase Studio ou via CLI.

### 3. Implementar Backend para Envio Real

As notificações atualmente são apenas salvas no banco. Para envio real, é necessário:

```javascript
// Exemplo com Node.js
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:seu@email.com',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Buscar subscrições do banco e enviar
const subscription = {
  endpoint: '...',
  keys: { p256dh: '...', auth: '...' }
};

const payload = JSON.stringify({
  title: 'Alerta de Caixa',
  message: 'Seu caixa pode ficar negativo em 3 dias',
  type: 'cash_low'
});

webpush.sendNotification(subscription, payload);
```

## Teste Rápido

1. Acesse o Dashboard
2. Clique no menu do usuário (canto superior direito)
3. Selecione "Notificações"
4. Ative o toggle "Notificações"
5. Aceite a permissão do navegador
6. Clique em "Testar Notificação"

Se tudo estiver correto:
- ✅ Nenhum erro no console
- ✅ Permissão solicitada e concedida
- ✅ Notificação de teste aparece
- ✅ Preferências salvas no banco

## RPCs Que Ainda Precisam Ser Implementados

⚠️ **Atenção:** Os seguintes RPCs são chamados pelo scheduler mas ainda não existem:

1. `get_cash_projection(p_user_id, p_days_ahead)` - usado em checkCashLowAlerts()
2. `get_daily_summary(p_user_id)` - usado em sendDailyDigest()
3. `get_weekly_summary(p_user_id)` - usado em sendWeeklySummary()

Esses RPCs precisam ser implementados ou substituídos por queries diretas para o sistema de agendamento funcionar completamente.

## Referências

- Documentação completa: [docs/NOTIFICACOES_PUSH.md](./NOTIFICACOES_PUSH.md)
- Migration: `supabase/migrations/20250118_notification_preferences.sql`
- Service Worker: `src/sw.ts`
