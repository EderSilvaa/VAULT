-- REFORMA TRIBUTÁRIA - Adequação do sistema VAULT TAX
-- Preparação para IBS/CBS (Lei Complementar 68/2024)
-- Transição gradual: 2026-2033

-- ============================================================
-- 1. ADICIONAR SUPORTE À REFORMA TRIBUTÁRIA
-- ============================================================

-- Adicionar colunas para nova tributação (IBS/CBS)
ALTER TABLE tax_settings
  ADD COLUMN IF NOT EXISTS tax_regime_version TEXT DEFAULT 'current'
    CHECK (tax_regime_version IN ('current', 'transition', 'reform')),

  -- IBS - Imposto sobre Bens e Serviços (substitui ICMS + ISS)
  ADD COLUMN IF NOT EXISTS ibs_rate DECIMAL(5,2), -- Alíquota estadual/municipal unificada
  ADD COLUMN IF NOT EXISTS ibs_state TEXT, -- Estado para IBS

  -- CBS - Contribuição sobre Bens e Serviços (substitui PIS/COFINS)
  ADD COLUMN IF NOT EXISTS cbs_rate DECIMAL(5,2), -- Alíquota federal

  -- Período de transição (2026-2033)
  ADD COLUMN IF NOT EXISTS transition_year INTEGER
    CHECK (transition_year IS NULL OR (transition_year >= 2026 AND transition_year <= 2033)),

  -- Cashback (devolução para baixa renda - novidade da reforma)
  ADD COLUMN IF NOT EXISTS eligible_for_cashback BOOLEAN DEFAULT false,

  -- Regime específico (mantém Simples Nacional após reforma)
  ADD COLUMN IF NOT EXISTS post_reform_regime TEXT
    CHECK (post_reform_regime IS NULL OR post_reform_regime IN (
      'simples_nacional_unificado', -- Simples com IBS/CBS
      'regime_geral', -- Regime geral IBS+CBS
      'mei_reform' -- MEI adaptado
    ));

-- ============================================================
-- 2. ADICIONAR CAMPOS DE REFORMA NAS CALCULATIONS
-- ============================================================

ALTER TABLE tax_calculations
  -- Novos impostos da reforma
  ADD COLUMN IF NOT EXISTS ibs_amount DECIMAL(12,2) DEFAULT 0, -- IBS (substitui ISS)
  ADD COLUMN IF NOT EXISTS cbs_amount DECIMAL(12,2) DEFAULT 0, -- CBS (substitui PIS/COFINS)

  -- Indicador de qual regime foi usado no cálculo
  ADD COLUMN IF NOT EXISTS tax_system_version TEXT DEFAULT 'current'
    CHECK (tax_system_version IN ('current', 'transition', 'reform')),

  -- Percentual de transição (ex: 2027 = 10% novo, 90% antigo)
  ADD COLUMN IF NOT EXISTS transition_percentage DECIMAL(5,2);

-- Atualizar a coluna calculada de total para incluir IBS/CBS
ALTER TABLE tax_calculations
  DROP COLUMN IF EXISTS total_tax_amount;

ALTER TABLE tax_calculations
  ADD COLUMN total_tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (
    COALESCE(das_amount, 0) +
    COALESCE(irpj_amount, 0) +
    COALESCE(iss_amount, 0) +
    COALESCE(inss_amount, 0) +
    COALESCE(ibs_amount, 0) +
    COALESCE(cbs_amount, 0)
  ) STORED;

-- ============================================================
-- 3. ADICIONAR SUPORTE AOS NOVOS IMPOSTOS EM PAYMENTS
-- ============================================================

-- Remover constraint antiga
ALTER TABLE tax_payments
  DROP CONSTRAINT IF EXISTS tax_payments_tax_type_check;

-- Adicionar constraint nova com IBS/CBS
ALTER TABLE tax_payments
  ADD CONSTRAINT tax_payments_tax_type_check
    CHECK (tax_type IN (
      -- Impostos atuais (até 2025)
      'das', 'darf_irpj', 'darf_iss', 'darf_inss',
      -- Novos impostos da reforma (2026+)
      'ibs', 'cbs',
      -- Genérico
      'other'
    ));

-- ============================================================
-- 4. TABELA DE ALÍQUOTAS DA REFORMA
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_reform_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Ano de vigência
  year INTEGER NOT NULL CHECK (year >= 2026 AND year <= 2050),

  -- Tipo de alíquota
  tax_type TEXT NOT NULL CHECK (tax_type IN ('ibs', 'cbs')),

  -- Alíquota padrão (estimativa inicial: IBS ~17.7%, CBS ~8.8%)
  standard_rate DECIMAL(5,2) NOT NULL,

  -- Alíquotas reduzidas (alguns setores)
  reduced_rate DECIMAL(5,2),
  reduced_sectors TEXT[], -- Ex: ['saude', 'educacao', 'transporte_publico']

  -- Alíquota zero (alguns produtos essenciais)
  zero_rated_sectors TEXT[], -- Ex: ['cesta_basica', 'medicamentos_essenciais']

  -- Percentual de transição (gradual de 2026 a 2033)
  transition_old_system DECIMAL(5,2), -- % ainda no sistema antigo
  transition_new_system DECIMAL(5,2), -- % já no sistema novo

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(year, tax_type)
);

-- ============================================================
-- 5. SEED DATA - Cronograma de Transição da Reforma
-- ============================================================

-- Período de teste (2026)
INSERT INTO tax_reform_rates (year, tax_type, standard_rate, transition_old_system, transition_new_system)
VALUES
  (2026, 'ibs', 0.10, 100.0, 0.0),  -- 2026: Ainda 100% sistema antigo, apenas teste
  (2026, 'cbs', 0.10, 100.0, 0.0);

-- Início da transição (2027-2032)
INSERT INTO tax_reform_rates (year, tax_type, standard_rate, transition_old_system, transition_new_system)
VALUES
  -- 2027: 10% novo, 90% antigo
  (2027, 'ibs', 1.77, 90.0, 10.0),
  (2027, 'cbs', 0.88, 90.0, 10.0),

  -- 2028: 20% novo, 80% antigo
  (2028, 'ibs', 3.54, 80.0, 20.0),
  (2028, 'cbs', 1.76, 80.0, 20.0),

  -- 2029: 30% novo, 70% antigo
  (2029, 'ibs', 5.31, 70.0, 30.0),
  (2029, 'cbs', 2.64, 70.0, 30.0),

  -- 2030: 40% novo, 60% antigo
  (2030, 'ibs', 7.08, 60.0, 40.0),
  (2030, 'cbs', 3.52, 60.0, 40.0),

  -- 2031: 60% novo, 40% antigo
  (2031, 'ibs', 10.62, 40.0, 60.0),
  (2031, 'cbs', 5.28, 40.0, 60.0),

  -- 2032: 80% novo, 20% antigo
  (2032, 'ibs', 14.16, 20.0, 80.0),
  (2032, 'cbs', 7.04, 20.0, 80.0);

-- Vigência plena (2033+)
INSERT INTO tax_reform_rates (year, tax_type, standard_rate, transition_old_system, transition_new_system)
VALUES
  (2033, 'ibs', 17.70, 0.0, 100.0), -- Estimativa IBS final
  (2033, 'cbs', 8.80, 0.0, 100.0);  -- Estimativa CBS final

-- Alíquotas reduzidas (estimativas)
UPDATE tax_reform_rates
SET
  reduced_rate = standard_rate * 0.60, -- 60% da alíquota padrão
  reduced_sectors = ARRAY['saude', 'educacao', 'transporte_publico', 'cultura'],
  zero_rated_sectors = ARRAY['cesta_basica_nacional', 'medicamentos_essenciais', 'dispositivos_acessibilidade']
WHERE year >= 2033;

-- ============================================================
-- 6. FUNÇÃO RPC - Calcular IBS/CBS (Reforma)
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_reform_taxes(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_settings RECORD;
  v_revenue_month DECIMAL(12,2);
  v_ibs_rate DECIMAL(5,2);
  v_cbs_rate DECIMAL(5,2);
  v_ibs_amount DECIMAL(12,2);
  v_cbs_amount DECIMAL(12,2);
  v_transition RECORD;
BEGIN
  -- Buscar configurações
  SELECT * INTO v_settings FROM tax_settings WHERE user_id = p_user_id;

  -- Se não estiver na reforma, retornar zeros
  IF v_settings.tax_regime_version = 'current' THEN
    RETURN jsonb_build_object(
      'ibs_amount', 0,
      'cbs_amount', 0,
      'message', 'User not using reform tax system'
    );
  END IF;

  -- Calcular receita do mês
  SELECT COALESCE(SUM(amount), 0) INTO v_revenue_month
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND EXTRACT(MONTH FROM date) = p_month
    AND EXTRACT(YEAR FROM date) = p_year;

  -- Buscar alíquotas da reforma para o ano
  SELECT * INTO v_transition
  FROM tax_reform_rates
  WHERE year = p_year AND tax_type = 'ibs'
  LIMIT 1;

  -- Se estiver em transição, usar alíquota proporcional
  IF v_transition IS NOT NULL THEN
    SELECT standard_rate INTO v_ibs_rate
    FROM tax_reform_rates
    WHERE year = p_year AND tax_type = 'ibs';

    SELECT standard_rate INTO v_cbs_rate
    FROM tax_reform_rates
    WHERE year = p_year AND tax_type = 'cbs';
  ELSE
    -- Usar alíquotas configuradas pelo usuário
    v_ibs_rate := COALESCE(v_settings.ibs_rate, 17.70);
    v_cbs_rate := COALESCE(v_settings.cbs_rate, 8.80);
  END IF;

  -- Calcular impostos
  v_ibs_amount := v_revenue_month * (v_ibs_rate / 100);
  v_cbs_amount := v_revenue_month * (v_cbs_rate / 100);

  RETURN jsonb_build_object(
    'ibs_amount', v_ibs_amount,
    'cbs_amount', v_cbs_amount,
    'ibs_rate', v_ibs_rate,
    'cbs_rate', v_cbs_rate,
    'revenue_month', v_revenue_month,
    'transition_percentage', v_transition.transition_new_system
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. ATUALIZAR FUNÇÃO DE CÁLCULO MENSAL PARA INCLUIR REFORMA
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_monthly_tax_with_reform(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_taxes JSONB;
  v_reform_taxes JSONB;
  v_settings RECORD;
  v_result JSONB;
BEGIN
  -- Buscar configurações
  SELECT * INTO v_settings FROM tax_settings WHERE user_id = p_user_id;

  -- Se ano < 2026, usar apenas sistema atual
  IF p_year < 2026 THEN
    v_current_taxes := calculate_monthly_tax(p_user_id, p_month, p_year);
    RETURN jsonb_build_object(
      'system', 'current',
      'taxes', v_current_taxes
    );
  END IF;

  -- Se ano >= 2033, usar apenas sistema da reforma
  IF p_year >= 2033 THEN
    v_reform_taxes := calculate_reform_taxes(p_user_id, p_month, p_year);
    RETURN jsonb_build_object(
      'system', 'reform',
      'taxes', v_reform_taxes
    );
  END IF;

  -- Período de transição (2026-2032): calcular ambos e combinar
  v_current_taxes := calculate_monthly_tax(p_user_id, p_month, p_year);
  v_reform_taxes := calculate_reform_taxes(p_user_id, p_month, p_year);

  RETURN jsonb_build_object(
    'system', 'transition',
    'current_taxes', v_current_taxes,
    'reform_taxes', v_reform_taxes,
    'year', p_year,
    'message', 'Período de transição - ambos os sistemas aplicáveis'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tax_reform_rates_year_type
  ON tax_reform_rates(year, tax_type);

-- ============================================================
-- 9. COMENTÁRIOS EXPLICATIVOS
-- ============================================================

COMMENT ON TABLE tax_reform_rates IS
  'Tabela de alíquotas da Reforma Tributária (LC 68/2024).
   Contém cronograma de transição 2026-2033 para IBS e CBS.';

COMMENT ON COLUMN tax_settings.tax_regime_version IS
  'Versão do sistema tributário:
   - current: Sistema atual (até 2025)
   - transition: Período de transição (2026-2032)
   - reform: Reforma plena (2033+)';

COMMENT ON COLUMN tax_settings.ibs_rate IS
  'IBS - Imposto sobre Bens e Serviços.
   Substitui ICMS (estadual) + ISS (municipal).
   Alíquota estimada final: ~17.7% (pode variar por estado).';

COMMENT ON COLUMN tax_settings.cbs_rate IS
  'CBS - Contribuição sobre Bens e Serviços.
   Substitui PIS + COFINS (federal).
   Alíquota estimada final: ~8.8%.';

COMMENT ON FUNCTION calculate_reform_taxes IS
  'Calcula IBS e CBS conforme a Reforma Tributária.
   Considera período de transição gradual (2026-2033).';
