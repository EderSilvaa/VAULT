-- VAULT TAX SYSTEM
-- Sistema completo de gestão tributária com cálculo automático, alertas e otimização AI

-- ============================================================
-- 1. TAX SETTINGS - Configurações do regime tributário
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Regime tributário
  regime TEXT NOT NULL DEFAULT 'simples_nacional'
    CHECK (regime IN ('simples_nacional', 'presumido', 'real', 'mei')),

  -- Simples Nacional
  simples_anexo TEXT CHECK (simples_anexo IN ('I', 'II', 'III', 'IV', 'V')),
  simples_revenue_bracket DECIMAL(15,2),

  -- ISS (Imposto Sobre Serviços)
  iss_rate DECIMAL(5,2) DEFAULT 2.00,
  iss_municipality TEXT,

  -- INSS/Previdência
  has_employees BOOLEAN DEFAULT false,
  employee_count INTEGER DEFAULT 0,
  prolabore_amount DECIMAL(12,2),

  -- Histórico de mudanças de regime (JSONB para flexibilidade)
  regime_history JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TAX CALCULATIONS - Cálculos mensais de impostos
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Período
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,

  -- Valores por tipo de imposto
  das_amount DECIMAL(12,2) DEFAULT 0,
  irpj_amount DECIMAL(12,2) DEFAULT 0,
  iss_amount DECIMAL(12,2) DEFAULT 0,
  inss_amount DECIMAL(12,2) DEFAULT 0,

  -- Total calculado automaticamente
  total_tax_amount DECIMAL(12,2) GENERATED ALWAYS AS
    (das_amount + irpj_amount + iss_amount + inss_amount) STORED,

  -- Metadados do cálculo
  calculation_type TEXT NOT NULL DEFAULT 'automatic'
    CHECK (calculation_type IN ('automatic', 'manual', 'hybrid')),
  is_manual_override BOOLEAN DEFAULT false,

  -- Base de receita para o cálculo
  revenue_base DECIMAL(12,2),
  revenue_last_12m DECIMAL(15,2),

  -- Detalhes do cálculo (JSON para auditoria)
  calculation_details JSONB,

  -- Status do cálculo
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'confirmed', 'paid', 'overdue')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  calculated_at TIMESTAMPTZ,

  -- Constraint: Único cálculo por usuário/mês/ano
  UNIQUE(user_id, month, year)
);

-- ============================================================
-- 3. TAX PAYMENTS - Pagamentos e vencimentos
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calculation_id UUID REFERENCES tax_calculations(id) ON DELETE SET NULL,

  -- Detalhes do pagamento
  tax_type TEXT NOT NULL CHECK (tax_type IN ('das', 'darf_irpj', 'darf_iss', 'darf_inss', 'other')),
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(12,2),

  -- Comprovante
  payment_code TEXT, -- Código de barras DAS/DARF
  transaction_id UUID REFERENCES transactions(id), -- Link com transação de pagamento

  -- Alertas
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TAX ALERTS - Alertas tributários
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES tax_payments(id) ON DELETE CASCADE,

  -- Tipo e severidade
  type TEXT NOT NULL CHECK (type IN (
    'deadline_approaching',  -- Vencimento próximo
    'payment_overdue',       -- Pagamento vencido
    'regime_optimization',   -- Sugestão de mudança de regime
    'bracket_change',        -- Mudança de faixa iminente
    'high_burden'           -- Carga tributária alta
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),

  -- Conteúdo
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Dados relacionados (JSON para flexibilidade)
  related_data JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TAX OPTIMIZATION HISTORY - Histórico de otimizações AI
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_optimization_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Data da análise
  analysis_date TIMESTAMPTZ DEFAULT NOW(),

  -- Regimes comparados
  current_regime TEXT NOT NULL,
  suggested_regime TEXT NOT NULL,

  -- Impacto financeiro
  current_annual_tax DECIMAL(15,2),
  projected_annual_tax DECIMAL(15,2),
  potential_savings DECIMAL(15,2),
  savings_percentage DECIMAL(5,2),

  -- Recomendação AI
  recommendation TEXT NOT NULL,
  reasoning JSONB, -- Justificativas e fatores analisados
  confidence DECIMAL(3,2), -- 0.00 - 1.00

  -- Ação do usuário
  user_action TEXT CHECK (user_action IN ('accepted', 'rejected', 'pending')),
  action_date TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. SIMPLES NACIONAL RATES - Tabela de taxas
-- ============================================================

CREATE TABLE IF NOT EXISTS simples_nacional_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anexo TEXT NOT NULL CHECK (anexo IN ('I', 'II', 'III', 'IV', 'V')),
  bracket_min DECIMAL(15,2) NOT NULL,
  bracket_max DECIMAL(15,2) NOT NULL,
  rate DECIMAL(5,4) NOT NULL,
  deduction DECIMAL(15,2) DEFAULT 0,
  description TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Tax Settings
CREATE INDEX IF NOT EXISTS idx_tax_settings_user ON tax_settings(user_id);

-- Tax Calculations
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_period ON tax_calculations(user_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_status ON tax_calculations(status);

-- Tax Payments
CREATE INDEX IF NOT EXISTS idx_tax_payments_user_status ON tax_payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tax_payments_due_date ON tax_payments(due_date) WHERE status = 'pending';

-- Tax Alerts
CREATE INDEX IF NOT EXISTS idx_tax_alerts_user_unread ON tax_alerts(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_tax_alerts_type ON tax_alerts(type);

-- Tax Optimization
CREATE INDEX IF NOT EXISTS idx_tax_optimization_user ON tax_optimization_history(user_id);

-- Simples Nacional Rates
CREATE INDEX IF NOT EXISTS idx_simples_rates_anexo_bracket ON simples_nacional_rates(anexo, bracket_min, bracket_max);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_optimization_history ENABLE ROW LEVEL SECURITY;

-- Tax Settings Policies
CREATE POLICY "Users can view their own tax settings"
  ON tax_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax settings"
  ON tax_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax settings"
  ON tax_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax settings"
  ON tax_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Tax Calculations Policies
CREATE POLICY "Users can view their own tax calculations"
  ON tax_calculations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax calculations"
  ON tax_calculations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax calculations"
  ON tax_calculations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax calculations"
  ON tax_calculations FOR DELETE
  USING (auth.uid() = user_id);

-- Tax Payments Policies
CREATE POLICY "Users can view their own tax payments"
  ON tax_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax payments"
  ON tax_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax payments"
  ON tax_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax payments"
  ON tax_payments FOR DELETE
  USING (auth.uid() = user_id);

-- Tax Alerts Policies
CREATE POLICY "Users can view their own tax alerts"
  ON tax_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax alerts"
  ON tax_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax alerts"
  ON tax_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax alerts"
  ON tax_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Tax Optimization Policies
CREATE POLICY "Users can view their own tax optimization history"
  ON tax_optimization_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax optimization history"
  ON tax_optimization_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Simples Nacional Rates - Public read access (no RLS needed for reference table)

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tax_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tax Settings Trigger
CREATE TRIGGER update_tax_settings_timestamp
  BEFORE UPDATE ON tax_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_updated_at();

-- Tax Calculations Trigger
CREATE TRIGGER update_tax_calculations_timestamp
  BEFORE UPDATE ON tax_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_updated_at();

-- Tax Payments Trigger
CREATE TRIGGER update_tax_payments_timestamp
  BEFORE UPDATE ON tax_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_updated_at();

-- ============================================================
-- RPC FUNCTIONS - Cálculo de Impostos
-- ============================================================

-- Função auxiliar: Buscar taxa do Simples Nacional
CREATE OR REPLACE FUNCTION get_simples_rate(
  p_revenue_12m DECIMAL(15,2),
  p_anexo TEXT
)
RETURNS DECIMAL(5,4) AS $$
DECLARE
  v_rate DECIMAL(5,4);
BEGIN
  SELECT rate INTO v_rate
  FROM simples_nacional_rates
  WHERE anexo = p_anexo
    AND p_revenue_12m >= bracket_min
    AND p_revenue_12m < bracket_max
  LIMIT 1;

  RETURN COALESCE(v_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- Calcular DAS (Simples Nacional)
CREATE OR REPLACE FUNCTION calculate_das_tax(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_settings RECORD;
  v_revenue_month DECIMAL(12,2);
  v_revenue_12m DECIMAL(15,2);
  v_das_rate DECIMAL(5,4);
  v_das_amount DECIMAL(12,2);
  v_bracket_min DECIMAL(15,2);
  v_bracket_max DECIMAL(15,2);
BEGIN
  -- Buscar configurações do usuário
  SELECT * INTO v_settings FROM tax_settings WHERE user_id = p_user_id;

  IF NOT FOUND OR v_settings.regime != 'simples_nacional' THEN
    RETURN jsonb_build_object(
      'error', 'User not in Simples Nacional regime',
      'das_amount', 0
    );
  END IF;

  -- Calcular receita do mês
  SELECT COALESCE(SUM(amount), 0) INTO v_revenue_month
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND EXTRACT(MONTH FROM date) = p_month
    AND EXTRACT(YEAR FROM date) = p_year;

  -- Calcular receita últimos 12 meses (para determinar faixa)
  SELECT COALESCE(SUM(amount), 0) INTO v_revenue_12m
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND date >= (DATE(p_year || '-' || LPAD(p_month::text, 2, '0') || '-01') - INTERVAL '12 months')
    AND date < DATE(p_year || '-' || LPAD(p_month::text, 2, '0') || '-01');

  -- Buscar taxa na tabela simples_nacional_rates
  SELECT rate, bracket_min, bracket_max INTO v_das_rate, v_bracket_min, v_bracket_max
  FROM simples_nacional_rates
  WHERE anexo = v_settings.simples_anexo
    AND v_revenue_12m >= bracket_min
    AND v_revenue_12m < bracket_max
  LIMIT 1;

  -- Se não encontrou taxa, usar 0
  v_das_rate := COALESCE(v_das_rate, 0);

  -- Calcular DAS do mês
  v_das_amount := v_revenue_month * v_das_rate;

  RETURN jsonb_build_object(
    'das_amount', v_das_amount,
    'revenue_month', v_revenue_month,
    'revenue_12m', v_revenue_12m,
    'rate', v_das_rate,
    'anexo', v_settings.simples_anexo,
    'bracket_min', v_bracket_min,
    'bracket_max', v_bracket_max
  );
END;
$$ LANGUAGE plpgsql;

-- Calcular ISS (Imposto Sobre Serviços)
CREATE OR REPLACE FUNCTION calculate_iss_tax(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_iss_rate DECIMAL(5,2);
  v_service_revenue DECIMAL(12,2);
  v_iss_amount DECIMAL(12,2);
BEGIN
  -- Buscar taxa de ISS das configurações
  SELECT iss_rate INTO v_iss_rate FROM tax_settings WHERE user_id = p_user_id;

  -- Se não encontrou, usar taxa padrão de 2%
  v_iss_rate := COALESCE(v_iss_rate, 2.00);

  -- Calcular receita de serviços do mês
  SELECT COALESCE(SUM(amount), 0) INTO v_service_revenue
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND category IN ('Vendas', 'Serviços', 'Receita')
    AND EXTRACT(MONTH FROM date) = p_month
    AND EXTRACT(YEAR FROM date) = p_year;

  -- Calcular ISS
  v_iss_amount := v_service_revenue * (v_iss_rate / 100);

  RETURN jsonb_build_object(
    'iss_amount', v_iss_amount,
    'service_revenue', v_service_revenue,
    'rate', v_iss_rate
  );
END;
$$ LANGUAGE plpgsql;

-- Calcular INSS (Previdência)
CREATE OR REPLACE FUNCTION calculate_inss_tax(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_settings RECORD;
  v_inss_amount DECIMAL(12,2);
  v_prolabore DECIMAL(12,2);
BEGIN
  -- Buscar configurações
  SELECT * INTO v_settings FROM tax_settings WHERE user_id = p_user_id;

  -- Se não tem configurações ou não tem pró-labore, retorna 0
  IF NOT FOUND OR v_settings.prolabore_amount IS NULL OR v_settings.prolabore_amount = 0 THEN
    RETURN jsonb_build_object(
      'inss_amount', 0,
      'prolabore', 0
    );
  END IF;

  v_prolabore := v_settings.prolabore_amount;

  -- Cálculo simplificado: 11% sobre pró-labore (parte do colaborador)
  -- + 20% (parte patronal) = 31% total
  v_inss_amount := v_prolabore * 0.31;

  RETURN jsonb_build_object(
    'inss_amount', v_inss_amount,
    'prolabore', v_prolabore,
    'rate', 31.00
  );
END;
$$ LANGUAGE plpgsql;

-- Função orquestradora - Calcula todos os impostos do mês
CREATE OR REPLACE FUNCTION calculate_monthly_tax(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_das JSONB;
  v_iss JSONB;
  v_inss JSONB;
  v_total DECIMAL(12,2);
BEGIN
  -- Calcular cada imposto
  v_das := calculate_das_tax(p_user_id, p_month, p_year);
  v_iss := calculate_iss_tax(p_user_id, p_month, p_year);
  v_inss := calculate_inss_tax(p_user_id, p_month, p_year);

  -- Somar total
  v_total := COALESCE((v_das->>'das_amount')::DECIMAL, 0) +
             COALESCE((v_iss->>'iss_amount')::DECIMAL, 0) +
             COALESCE((v_inss->>'inss_amount')::DECIMAL, 0);

  RETURN jsonb_build_object(
    'das', v_das,
    'iss', v_iss,
    'inss', v_inss,
    'total_tax', v_total,
    'month', p_month,
    'year', p_year
  );
END;
$$ LANGUAGE plpgsql;

-- Função para salvar cálculo no banco
CREATE OR REPLACE FUNCTION save_tax_calculation(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER,
  p_calculation_result JSONB
)
RETURNS UUID AS $$
DECLARE
  v_calculation_id UUID;
BEGIN
  INSERT INTO tax_calculations (
    user_id,
    month,
    year,
    das_amount,
    iss_amount,
    inss_amount,
    revenue_base,
    revenue_last_12m,
    calculation_details,
    calculation_type,
    calculated_at
  ) VALUES (
    p_user_id,
    p_month,
    p_year,
    COALESCE((p_calculation_result->'das'->>'das_amount')::DECIMAL, 0),
    COALESCE((p_calculation_result->'iss'->>'iss_amount')::DECIMAL, 0),
    COALESCE((p_calculation_result->'inss'->>'inss_amount')::DECIMAL, 0),
    COALESCE((p_calculation_result->'das'->>'revenue_month')::DECIMAL, 0),
    COALESCE((p_calculation_result->'das'->>'revenue_12m')::DECIMAL, 0),
    p_calculation_result,
    'automatic',
    NOW()
  )
  ON CONFLICT (user_id, month, year) DO UPDATE
  SET
    das_amount = EXCLUDED.das_amount,
    iss_amount = EXCLUDED.iss_amount,
    inss_amount = EXCLUDED.inss_amount,
    revenue_base = EXCLUDED.revenue_base,
    revenue_last_12m = EXCLUDED.revenue_last_12m,
    calculation_details = EXCLUDED.calculation_details,
    calculation_type = 'automatic',
    calculated_at = NOW()
  RETURNING id INTO v_calculation_id;

  RETURN v_calculation_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA - Simples Nacional Anexo III (Serviços)
-- ============================================================

INSERT INTO simples_nacional_rates (anexo, bracket_min, bracket_max, rate, deduction, description)
VALUES
  -- Anexo III - Receitas de locação de bens móveis e de prestação de serviços
  ('III', 0, 180000, 0.0600, 0, 'Até R$ 180 mil - 6%'),
  ('III', 180000, 360000, 0.1120, 9360, 'R$ 180k a R$ 360k - 11.2%'),
  ('III', 360000, 720000, 0.1350, 17640, 'R$ 360k a R$ 720k - 13.5%'),
  ('III', 720000, 1800000, 0.1600, 35640, 'R$ 720k a R$ 1.8mi - 16%'),
  ('III', 1800000, 3600000, 0.2100, 125640, 'R$ 1.8mi a R$ 3.6mi - 21%'),
  ('III', 3600000, 4800000, 0.3300, 648000, 'R$ 3.6mi a R$ 4.8mi - 33%')
ON CONFLICT DO NOTHING;

-- Anexo V - Serviços específicos (exemplo simplificado)
INSERT INTO simples_nacional_rates (anexo, bracket_min, bracket_max, rate, deduction, description)
VALUES
  ('V', 0, 180000, 0.1550, 0, 'Até R$ 180 mil - 15.5%'),
  ('V', 180000, 360000, 0.1800, 4500, 'R$ 180k a R$ 360k - 18%'),
  ('V', 360000, 720000, 0.1950, 9900, 'R$ 360k a R$ 720k - 19.5%'),
  ('V', 720000, 1800000, 0.2050, 17100, 'R$ 720k a R$ 1.8mi - 20.5%'),
  ('V', 1800000, 3600000, 0.2300, 62100, 'R$ 1.8mi a R$ 3.6mi - 23%'),
  ('V', 3600000, 4800000, 0.3050, 540000, 'R$ 3.6mi a R$ 4.8mi - 30.5%')
ON CONFLICT DO NOTHING;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE tax_settings IS 'Configurações do regime tributário do usuário';
COMMENT ON TABLE tax_calculations IS 'Cálculos mensais de impostos (automático + manual)';
COMMENT ON TABLE tax_payments IS 'Pagamentos e vencimentos de impostos';
COMMENT ON TABLE tax_alerts IS 'Alertas sobre vencimentos e otimizações';
COMMENT ON TABLE tax_optimization_history IS 'Histórico de sugestões de otimização AI';
COMMENT ON TABLE simples_nacional_rates IS 'Tabela de alíquotas do Simples Nacional';

COMMENT ON FUNCTION calculate_das_tax IS 'Calcula DAS (Simples Nacional) baseado na receita';
COMMENT ON FUNCTION calculate_iss_tax IS 'Calcula ISS sobre serviços';
COMMENT ON FUNCTION calculate_inss_tax IS 'Calcula INSS sobre pró-labore';
COMMENT ON FUNCTION calculate_monthly_tax IS 'Calcula todos os impostos do mês';
COMMENT ON FUNCTION save_tax_calculation IS 'Salva cálculo na tabela tax_calculations';
