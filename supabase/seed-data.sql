-- Seed Data para Testes - Vault Caixa Alerta
-- Execute este SQL no Supabase SQL Editor para adicionar dados de exemplo

-- IMPORTANTE: Substitua 'SEU-USER-ID-AQUI' pelo ID do seu usuário
-- Para pegar o ID: Vá em Authentication → Users → Copie o UUID

-- ========================================
-- TRANSAÇÕES DE EXEMPLO (Últimos 30 dias)
-- ========================================

-- Receitas
INSERT INTO transactions (user_id, type, amount, description, category, date)
VALUES
  -- Semana 1
  ('SEU-USER-ID-AQUI', 'income', 2500.00, 'Venda Cliente ABC Ltda', 'Vendas', NOW() - INTERVAL '25 days'),
  ('SEU-USER-ID-AQUI', 'income', 1800.00, 'Serviço Consultoria XYZ', 'Vendas', NOW() - INTERVAL '23 days'),
  ('SEU-USER-ID-AQUI', 'income', 3200.00, 'Pagamento Projeto Premium', 'Vendas', NOW() - INTERVAL '21 days'),

  -- Semana 2
  ('SEU-USER-ID-AQUI', 'income', 1500.00, 'Venda Produto Digital', 'Vendas', NOW() - INTERVAL '18 days'),
  ('SEU-USER-ID-AQUI', 'income', 2200.00, 'Cliente Recorrente MRR', 'Vendas', NOW() - INTERVAL '15 days'),
  ('SEU-USER-ID-AQUI', 'income', 900.00, 'Comissão Parceria', 'Vendas', NOW() - INTERVAL '14 days'),

  -- Semana 3
  ('SEU-USER-ID-AQUI', 'income', 3500.00, 'Projeto Fechado', 'Vendas', NOW() - INTERVAL '10 days'),
  ('SEU-USER-ID-AQUI', 'income', 1200.00, 'Venda Urgente', 'Vendas', NOW() - INTERVAL '8 days'),

  -- Semana 4
  ('SEU-USER-ID-AQUI', 'income', 2800.00, 'Mensalidade Cliente VIP', 'Vendas', NOW() - INTERVAL '5 days'),
  ('SEU-USER-ID-AQUI', 'income', 1600.00, 'Venda Produto Físico', 'Vendas', NOW() - INTERVAL '2 days'),
  ('SEU-USER-ID-AQUI', 'income', 2100.00, 'Pagamento Antecipado', 'Vendas', NOW() - INTERVAL '1 day');

-- Despesas Fixas
INSERT INTO transactions (user_id, type, amount, description, category, date)
VALUES
  ('SEU-USER-ID-AQUI', 'expense', 3000.00, 'Aluguel Escritório', 'Fixo', NOW() - INTERVAL '26 days'),
  ('SEU-USER-ID-AQUI', 'expense', 450.00, 'Energia Elétrica', 'Fixo', NOW() - INTERVAL '24 days'),
  ('SEU-USER-ID-AQUI', 'expense', 180.00, 'Internet Fibra 500MB', 'Fixo', NOW() - INTERVAL '22 days'),
  ('SEU-USER-ID-AQUI', 'expense', 89.90, 'SaaS - Ferramenta Gestão', 'Fixo', NOW() - INTERVAL '20 days'),
  ('SEU-USER-ID-AQUI', 'expense', 250.00, 'Contador Mensal', 'Fixo', NOW() - INTERVAL '19 days');

-- Despesas Variáveis
INSERT INTO transactions (user_id, type, amount, description, category, date)
VALUES
  -- Fornecedores
  ('SEU-USER-ID-AQUI', 'expense', 850.00, 'Fornecedor Matéria Prima', 'Fornecedores', NOW() - INTERVAL '20 days'),
  ('SEU-USER-ID-AQUI', 'expense', 1200.00, 'Estoque Produtos', 'Fornecedores', NOW() - INTERVAL '17 days'),
  ('SEU-USER-ID-AQUI', 'expense', 650.00, 'Fornecedor Embalagens', 'Fornecedores', NOW() - INTERVAL '12 days'),

  -- Marketing
  ('SEU-USER-ID-AQUI', 'expense', 500.00, 'Google Ads Campanha', 'Marketing', NOW() - INTERVAL '16 days'),
  ('SEU-USER-ID-AQUI', 'expense', 350.00, 'Instagram Ads', 'Marketing', NOW() - INTERVAL '11 days'),
  ('SEU-USER-ID-AQUI', 'expense', 200.00, 'Designer Freelancer', 'Marketing', NOW() - INTERVAL '7 days'),

  -- Operacional
  ('SEU-USER-ID-AQUI', 'expense', 120.00, 'Uber/99 Transporte', 'Variável', NOW() - INTERVAL '15 days'),
  ('SEU-USER-ID-AQUI', 'expense', 280.00, 'Material Escritório', 'Variável', NOW() - INTERVAL '13 days'),
  ('SEU-USER-ID-AQUI', 'expense', 95.00, 'Correios Envios', 'Variável', NOW() - INTERVAL '9 days'),
  ('SEU-USER-ID-AQUI', 'expense', 450.00, 'Manutenção Equipamento', 'Variável', NOW() - INTERVAL '6 days'),

  -- Impostos
  ('SEU-USER-ID-AQUI', 'expense', 380.00, 'DAS MEI', 'Impostos', NOW() - INTERVAL '28 days'),
  ('SEU-USER-ID-AQUI', 'expense', 150.00, 'ISS Serviços', 'Impostos', NOW() - INTERVAL '14 days'),

  -- Recentes
  ('SEU-USER-ID-AQUI', 'expense', 75.00, 'Almoço Cliente Reunião', 'Outros', NOW() - INTERVAL '3 days'),
  ('SEU-USER-ID-AQUI', 'expense', 320.00, 'Curso Online Capacitação', 'Outros', NOW() - INTERVAL '1 day');

-- ========================================
-- METAS FINANCEIRAS
-- ========================================

INSERT INTO financial_goals (user_id, title, target_amount, current_amount, deadline)
VALUES
  ('SEU-USER-ID-AQUI', 'Reserva de Emergência', 15000.00, 8500.00, NOW() + INTERVAL '6 months'),
  ('SEU-USER-ID-AQUI', 'Expansão do Negócio', 30000.00, 12000.00, NOW() + INTERVAL '12 months'),
  ('SEU-USER-ID-AQUI', 'Quitação de Dívidas', 10000.00, 7500.00, NOW() + INTERVAL '8 months'),
  ('SEU-USER-ID-AQUI', 'Compra Equipamento Novo', 8000.00, 3200.00, NOW() + INTERVAL '4 months'),
  ('SEU-USER-ID-AQUI', 'Férias Planejadas', 5000.00, 1800.00, NOW() + INTERVAL '10 months');

-- ========================================
-- VERIFICAR SE FUNCIONOU
-- ========================================

-- Execute estas queries para conferir:

-- Ver total de transações por tipo
SELECT
  type,
  COUNT(*) as quantidade,
  SUM(amount) as total
FROM transactions
WHERE user_id = 'SEU-USER-ID-AQUI'
GROUP BY type;

-- Ver saldo atual
SELECT
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as saldo_atual
FROM transactions
WHERE user_id = 'SEU-USER-ID-AQUI';

-- Ver metas
SELECT
  title,
  current_amount,
  target_amount,
  ROUND((current_amount / target_amount * 100)::numeric, 0) as percentual
FROM financial_goals
WHERE user_id = 'SEU-USER-ID-AQUI';

-- ========================================
-- RESUMO DO QUE FOI INSERIDO
-- ========================================

-- Receitas: 11 transações = R$ 23.300,00
-- Despesas: 19 transações = R$ 9.639,90
-- Saldo: R$ 13.660,10
-- Metas: 5 metas financeiras

-- Com esses dados você pode testar:
-- ✅ Dashboard com transações reais
-- ✅ Gráficos de receita vs despesas
-- ✅ Projeção de fluxo de caixa
-- ✅ Metas com progresso
-- ✅ Lista de transações
