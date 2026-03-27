# 15 melhorias identificadas no code review

Data: 2026-02-16
Status: pendente de validacao e execucao

## Prioridade critica

1. Remover grants perigosos para `anon` e `authenticated`
- Problema: permissao ampla em todas as tabelas/sequences.
- Arquivo: `supabase/migrations/20250126_fix_trigger_final.sql:35`, `supabase/migrations/20250126_fix_trigger_final.sql:36`
- Acao: restringir grants ao minimo necessario e revisar RLS por tabela.

2. Corrigir IDOR em RPCs `SECURITY DEFINER` que aceitam `p_user_id`
- Problema: funcoes podem operar em dados de outro usuario sem validar `auth.uid()`.
- Arquivo: `supabase/migrations/20250117_ai_analysis_system_safe.sql:106`, `supabase/migrations/20250117_ai_analysis_system_safe.sql:135`, `supabase/migrations/20250118_notification_preferences.sql:80`, `supabase/migrations/20250118_notification_preferences.sql:129`
- Acao: validar `p_user_id = auth.uid()` internamente ou remover parametro sensivel.

3. Adicionar validacao de ownership no `pluggy-api`
- Problema: endpoints de list/get/delete por payload sem validar dono do `itemId/accountId`.
- Arquivo: `supabase/functions/pluggy-api/index.ts:74`, `supabase/functions/pluggy-api/index.ts:85`, `supabase/functions/pluggy-api/index.ts:92`, `supabase/functions/pluggy-api/index.ts:104`
- Acao: checar relacao item/account com usuario autenticado antes de executar acao.

4. Restringir view `expiring_consents`
- Problema: view exposta com `bc.*` para `authenticated`.
- Arquivo: `supabase/migrations/003_consent_tracking.sql:40`, `supabase/migrations/003_consent_tracking.sql:42`, `supabase/migrations/003_consent_tracking.sql:50`
- Acao: projetar somente colunas necessarias e limitar grants.

## Prioridade alta

5. Corrigir assinatura incorreta de `createTransaction` no Dashboard
- Problema: chamada nao bate com assinatura esperada, risco de erro em runtime.
- Arquivo: `src/pages/Dashboard.tsx:195`, `src/pages/Dashboard.tsx:236`, `src/services/transactions.service.ts:67`
- Acao: alinhar payload/chamada com tipo e contrato real do service.

6. Resolver dependencia de function ausente `rapid-service`
- Problema: frontend invoca function nao presente no repo.
- Arquivo: `src/services/ai.service.ts:55`, `src/services/ai.service.ts:91`, `src/services/ai.service.ts:118`, `src/services/ai.service.ts:396`
- Acao: criar/deploy da function faltante ou trocar chamadas para endpoint existente.

7. Alinhar action de otimizacao tributaria com `ai-insights`
- Problema: `tax.service` chama action nao suportada no switch da edge function.
- Arquivo: `src/services/tax.service.ts:478`, `supabase/functions/ai-insights/index.ts:81`, `supabase/functions/ai-insights/index.ts:113`
- Acao: adicionar case correspondente no backend ou ajustar action no frontend.

8. Corrigir bug de intervalo de datas em virada de ano
- Problema: filtro de periodo pode quebrar calculo entre anos.
- Arquivo: `src/services/tax.service.ts:156`, `src/services/tax.service.ts:157`, `src/services/tax.service.ts:160`, `src/services/tax.service.ts:161`
- Acao: usar intervalo de datas completo (start/end) sem depender de mes/ano isolados.

9. Integrar fluxo da reforma tributaria no frontend e persistencia
- Problema: schema/migrations evoluiram, mas fluxo nao esta completamente ligado no app.
- Arquivo: `src/services/tax.service.ts:107`, `supabase/migrations/20250127_tax_reform_compliance.sql:250`, `supabase/migrations/20250127_tax_system.sql:557`
- Acao: conectar campos novos no form, validacao, salvamento e leitura.

10. Implementar RPCs ausentes do scheduler de notificacoes
- Problema: chamadas para funcoes nao encontradas no banco.
- Arquivo: `src/services/notification-scheduler.service.ts:145`, `src/services/notification-scheduler.service.ts:231`, `src/services/notification-scheduler.service.ts:258`
- Acao: criar RPCs no banco ou ajustar scheduler para funcoes existentes.

11. Resolver drift de schema em metas financeiras
- Problema: hook usa colunas nao presentes na base de schema analisada.
- Arquivo: `src/hooks/useSmartGoals.ts:113`, `src/hooks/useSmartGoals.ts:120`, `supabase/schema.sql:48`
- Acao: unificar origem de verdade (migrations vs schema dump) e corrigir colunas.

## Prioridade media

12. Evitar divisao por zero no calculo de anomalias de IA
- Problema: risco de `Infinity/NaN` em cenario limite.
- Arquivo: `supabase/functions/ai-insights/index.ts:332`
- Acao: aplicar guarda para denominador zero antes da divisao.

13. Corrigir uso invalido de `supabase.raw(...)` no cron
- Problema: uso nao suportado no client atual durante update de falha.
- Arquivo: `supabase/functions/ai-analysis-cron/index.ts:120`
- Acao: substituir por update padrao ou RPC dedicada.

14. Ajustar bootstrap que depende de RPC `exec_sql` indefinida
- Problema: script de setup referencia funcao que nao esta garantida.
- Arquivo: `scripts/setup-database.js:40`
- Acao: remover dependencia dessa RPC, usar migracoes oficiais/CLI.

15. Ajustar configuracao do ESLint para ignorar `dev-dist`
- Problema: lint pega bundles gerados e cria ruido (muitos erros irrelevantes).
- Arquivo: `eslint.config.js:8`
- Acao: incluir `dev-dist/**` no ignore e manter foco no codigo-fonte.

## Sugestao de execucao por fases

- Fase 1 (seguranca): itens 1, 2, 3, 4.
- Fase 2 (quebras funcionais): itens 5, 6, 7, 8, 10.
- Fase 3 (consistencia e manutencao): itens 9, 11, 12, 13, 14, 15.
