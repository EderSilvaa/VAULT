# Sistema de Notificações Push - Vault

## Visão Geral

O sistema de notificações push permite que os usuários recebam alertas importantes sobre seu fluxo de caixa diretamente no navegador, mesmo quando o app não está aberto.

## Funcionalidades Implementadas

### 1. Componentes de UI
- **NotificationSettings**: Interface completa para gerenciar preferências de notificações
- **useNotifications Hook**: Gerenciamento de estado e lógica de notificações
- **Switch Component**: Componente UI para toggles

### 2. Service Worker Customizado
- Service Worker com suporte a Push API
- Cache inteligente com Workbox
- Handlers para eventos de notificação (push, click, close)
- Navegação automática baseada no tipo de notificação

### 3. Serviços Backend
- **notification.service.ts**: Gerenciamento de permissões e subscrições
- **notification-scheduler.service.ts**: Agendamento automático de notificações

### 4. Database
- Tabela `notification_preferences`: Armazena preferências do usuário
- Tabela `notification_history`: Histórico de todas as notificações

## Como Configurar

### Passo 1: Gerar Chaves VAPID

As chaves VAPID são necessárias para autenticação de push notifications.

```bash
# Instalar web-push globalmente
npm install -g web-push

# Gerar chaves VAPID
npx web-push generate-vapid-keys
```

Você receberá algo como:

```
Public Key: BNe...
Private Key: Jz...
```

### Passo 2: Configurar Variáveis de Ambiente

Crie/atualize o arquivo `.env.local`:

```env
# VAPID Keys para Push Notifications
VITE_VAPID_PUBLIC_KEY=BNe... (cole a chave pública aqui)
VAPID_PRIVATE_KEY=Jz... (cole a chave privada aqui)
```

**IMPORTANTE**: A `VITE_VAPID_PUBLIC_KEY` precisa do prefixo `VITE_` para funcionar no frontend.

### Passo 3: Executar a Migration

A migration já existe em `supabase/migrations/20250118_notification_preferences.sql`.

Execute-a no Supabase:

```bash
# Via CLI do Supabase
supabase db push

# OU copie e execute o SQL manualmente no Supabase Studio
```

### Passo 4: Testar as Notificações

1. Acesse o Dashboard
2. Clique no menu do usuário (canto superior direito)
3. Selecione "Notificações"
4. Ative o toggle "Notificações"
5. Aceite a permissão do navegador
6. Clique em "Testar Notificação"

## Tipos de Notificações

### Alertas Instantâneos
- ⚠️ **Caixa Baixo**: Quando o saldo está abaixo do limite
- 🎯 **Progresso de Metas**: Atualizações sobre metas financeiras
- 📊 **Análise Pronta**: Quando nova análise está disponível
- ⏰ **Pagamentos Recorrentes**: Lembretes de contas a pagar
- 🔍 **Anomalias**: Gastos ou receitas fora do padrão

### Resumos Agendados
- 📊 **Resumo Diário**: Enviado no horário escolhido
- 📈 **Resumo Semanal**: Enviado no dia e horário escolhidos

## Configurações Disponíveis

### Tipos de Alertas
Escolha quais eventos você deseja ser notificado

### Resumos Automáticos
- Resumo Diário: Configure o horário (ex: 08:00)
- Resumo Semanal: Configure o dia da semana e horário (ex: Segunda, 09:00)

### Horário de Silêncio
Configure um período em que não deseja receber notificações (ex: 22:00 às 08:00)

### Canais de Notificação
- ✅ **Push**: Notificações no navegador (disponível)
- 🔜 **Email**: Em breve
- 🔜 **WhatsApp**: Em breve

## Arquitetura Técnica

### Frontend
```
src/
├── components/
│   ├── NotificationSettings.tsx   # UI de configuração
│   └── ui/switch.tsx              # Componente Switch
├── hooks/
│   └── useNotifications.ts        # Hook de gerenciamento
├── services/
│   ├── notification.service.ts    # Serviço principal
│   └── notification-scheduler.service.ts  # Agendamento
└── sw.ts                          # Service Worker customizado
```

### Backend (Supabase)
```
notification_preferences
├── user_id
├── enabled
├── alert_cash_low
├── alert_goals_progress
├── daily_digest
├── daily_digest_time
├── quiet_hours_enabled
└── push_subscription (JSONB)

notification_history
├── user_id
├── type
├── title
├── message
├── channel
├── status
└── data (JSONB)
```

### Service Worker
O service worker em `src/sw.ts` gerencia:
- Recebimento de push notifications
- Cache de assets e API calls
- Navegação quando notificação é clicada
- Sincronização em background

## Navegação Inteligente

Quando o usuário clica em uma notificação, o app abre automaticamente na seção relevante:

- **Caixa Baixo** → `/dashboard?tab=projection`
- **Progresso de Metas** → `/dashboard?tab=goals`
- **Análise Pronta** → `/dashboard?tab=analysis`
- Meta específica → `/dashboard?tab=goals&goal=ID`

## Próximos Passos

### Backend (Necessário para Produção)
Para push notifications funcionarem em produção, você precisa de um backend que:

1. Armazene as subscrições dos usuários
2. Envie as notificações usando a Web Push API
3. Processe os eventos agendados

Exemplo com Node.js:

```javascript
const webpush = require('web-push');

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:seu@email.com',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Enviar notificação
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

### Melhorias Futuras
- [ ] Backend para envio real de push notifications
- [ ] Integração com Email (SendGrid, AWS SES)
- [ ] Integração com WhatsApp Business API
- [ ] Dashboard de histórico de notificações
- [ ] Analytics de engajamento
- [ ] Notificações ricas com ações (responder, adiar)

## Troubleshooting

### "VAPID key not configured"
- Gere as chaves VAPID
- Adicione ao `.env.local`
- Reinicie o servidor dev

### "Permission denied"
- Verifique as configurações do navegador
- Limpe o cache e tente novamente
- Em alguns navegadores, só funciona em HTTPS

### Notificações não aparecem
- Verifique se o service worker está registrado
- Abra DevTools → Application → Service Workers
- Verifique se a permissão foi concedida
- Teste a notificação manualmente

### Service Worker não atualiza
```bash
# No navegador:
# 1. DevTools → Application → Service Workers
# 2. Marque "Update on reload"
# 3. Clique "Unregister" e recarregue a página
```

## Recursos Úteis

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push NPM Package](https://www.npmjs.com/package/web-push)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

## Suporte

Navegadores suportados:
- ✅ Chrome/Edge 50+
- ✅ Firefox 44+
- ✅ Safari 16+ (macOS 13+)
- ❌ Internet Explorer (não suportado)

Plataformas:
- ✅ Desktop (Windows, macOS, Linux)
- ✅ Android
- ✅ iOS 16.4+ (com limitações)
