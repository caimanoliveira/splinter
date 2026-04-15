-- =============================================
-- Fase 1: Decision Canvas, Check-ins, Marcos
-- =============================================

-- Decision Canvas (versionado por mentorado)
CREATE TABLE canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES mentorados(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT 'Meu Decision Canvas',
  -- 7 dimensões
  context TEXT,           -- 1. Contexto da decisão
  criteria TEXT,          -- 2. Critérios explícitos
  constraints TEXT,       -- 3. Restrições reais
  invisible_vars TEXT,    -- 4. Variáveis invisíveis
  value_patterns TEXT,    -- 5. Padrões de valor
  possibilities TEXT,     -- 6. Espaço de possibilidades
  scenarios TEXT,         -- 7. Cenários e trade-offs
  final_decision TEXT,    -- Decisão final
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_canvas_mentorado ON canvas(mentorado_id);
CREATE INDEX idx_canvas_status ON canvas(status);

CREATE OR REPLACE FUNCTION update_canvas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER canvas_updated_at
  BEFORE UPDATE ON canvas
  FOR EACH ROW EXECUTE FUNCTION update_canvas_updated_at();

-- Check-ins assíncronos entre sessões
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES mentorados(id) ON DELETE CASCADE,
  clarity_score INT NOT NULL CHECK (clarity_score BETWEEN 1 AND 10),
  confidence_score INT NOT NULL CHECK (confidence_score BETWEEN 1 AND 10),
  mood TEXT NOT NULL DEFAULT 'neutral' CHECK (mood IN ('energized', 'neutral', 'stuck', 'anxious')),
  wins TEXT,
  blockers TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checkins_mentorado ON checkins(mentorado_id);
CREATE INDEX idx_checkins_created_at ON checkins(created_at DESC);

-- Marcos da travessia (milestones)
CREATE TABLE marcos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES mentorados(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INT NOT NULL DEFAULT 0,
  is_achieved BOOLEAN NOT NULL DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marcos_mentorado ON marcos(mentorado_id);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE canvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcos ENABLE ROW LEVEL SECURITY;

-- canvas
CREATE POLICY canvas_select ON canvas
  FOR SELECT USING (mentorado_id = get_mentorado_id());

CREATE POLICY canvas_insert ON canvas
  FOR INSERT WITH CHECK (mentorado_id = get_mentorado_id());

CREATE POLICY canvas_update ON canvas
  FOR UPDATE USING (mentorado_id = get_mentorado_id());

-- checkins
CREATE POLICY checkins_select ON checkins
  FOR SELECT USING (mentorado_id = get_mentorado_id());

CREATE POLICY checkins_insert ON checkins
  FOR INSERT WITH CHECK (mentorado_id = get_mentorado_id());

-- marcos
CREATE POLICY marcos_select ON marcos
  FOR SELECT USING (mentorado_id = get_mentorado_id());

CREATE POLICY marcos_update ON marcos
  FOR UPDATE USING (mentorado_id = get_mentorado_id());
