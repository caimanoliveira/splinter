-- =============================================
-- P3: Trilhas Guiadas
-- =============================================

-- Atribuição de trilha ao mentorado (conteúdo vive em código, slug referencia)
CREATE TABLE mentorado_trilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES mentorados(id) ON DELETE CASCADE,
  trilha_slug TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE (mentorado_id, trilha_slug)
);

CREATE INDEX idx_mentorado_trilhas_mentorado ON mentorado_trilhas(mentorado_id);

-- Estado/resposta do mentorado por etapa (uma linha por etapa iniciada)
CREATE TABLE etapa_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_trilha_id UUID NOT NULL REFERENCES mentorado_trilhas(id) ON DELETE CASCADE,
  etapa_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
  resposta JSONB,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mentorado_trilha_id, etapa_slug)
);

CREATE INDEX idx_etapa_respostas_mt ON etapa_respostas(mentorado_trilha_id);

CREATE OR REPLACE FUNCTION update_etapa_respostas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER etapa_respostas_updated_at
  BEFORE UPDATE ON etapa_respostas
  FOR EACH ROW EXECUTE FUNCTION update_etapa_respostas_updated_at();

-- Coluna para rastrear tarefas geradas por trilha
ALTER TABLE tarefas ADD COLUMN origem TEXT;
CREATE INDEX idx_tarefas_origem ON tarefas(origem);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE mentorado_trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapa_respostas ENABLE ROW LEVEL SECURITY;

-- mentorado_trilhas: mentorado lê as suas próprias; mutações via service role (CRM)
CREATE POLICY mentorado_trilhas_select ON mentorado_trilhas
  FOR SELECT USING (mentorado_id = get_mentorado_id());

CREATE POLICY mentorado_trilhas_update_started ON mentorado_trilhas
  FOR UPDATE USING (mentorado_id = get_mentorado_id());

-- etapa_respostas: mentorado lê/escreve as suas (via join com mentorado_trilhas)
CREATE POLICY etapa_respostas_select ON etapa_respostas
  FOR SELECT USING (
    mentorado_trilha_id IN (
      SELECT id FROM mentorado_trilhas WHERE mentorado_id = get_mentorado_id()
    )
  );

CREATE POLICY etapa_respostas_insert ON etapa_respostas
  FOR INSERT WITH CHECK (
    mentorado_trilha_id IN (
      SELECT id FROM mentorado_trilhas WHERE mentorado_id = get_mentorado_id()
    )
  );

CREATE POLICY etapa_respostas_update ON etapa_respostas
  FOR UPDATE USING (
    mentorado_trilha_id IN (
      SELECT id FROM mentorado_trilhas WHERE mentorado_id = get_mentorado_id()
    )
  );

-- =============================================
-- RPC: submissão atômica do plano de ação (insert tarefas + upsert resposta)
-- =============================================

CREATE OR REPLACE FUNCTION submit_plano_acao(
  p_mentorado_trilha_id UUID,
  p_etapa_slug TEXT,
  p_origem TEXT,
  p_acoes JSONB -- [{competencia_id, descricao, prazo}]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mentorado_id UUID;
  v_acao JSONB;
  v_tarefa_ids UUID[] := ARRAY[]::UUID[];
  v_new_id UUID;
  v_existing_status TEXT;
BEGIN
  SELECT mt.mentorado_id INTO v_mentorado_id
    FROM mentorado_trilhas mt
    WHERE mt.id = p_mentorado_trilha_id
      AND mt.mentorado_id = get_mentorado_id();

  IF v_mentorado_id IS NULL THEN
    RAISE EXCEPTION 'mentorado_trilha_not_found_or_unauthorized';
  END IF;

  SELECT status INTO v_existing_status
    FROM etapa_respostas
    WHERE mentorado_trilha_id = p_mentorado_trilha_id
      AND etapa_slug = p_etapa_slug;

  IF v_existing_status = 'done' THEN
    RAISE EXCEPTION 'plano_acao_ja_submetido';
  END IF;

  FOR v_acao IN SELECT * FROM jsonb_array_elements(p_acoes) LOOP
    INSERT INTO tarefas (mentorado_id, title, description, due_date, status, created_by_mentor, origem)
    VALUES (
      v_mentorado_id,
      v_acao->>'descricao',
      'Ação do plano de desenvolvimento',
      (v_acao->>'prazo')::DATE,
      'pending',
      FALSE,
      p_origem
    )
    RETURNING id INTO v_new_id;
    v_tarefa_ids := array_append(v_tarefa_ids, v_new_id);
  END LOOP;

  INSERT INTO etapa_respostas (mentorado_trilha_id, etapa_slug, status, resposta, completed_at)
  VALUES (
    p_mentorado_trilha_id,
    p_etapa_slug,
    'done',
    jsonb_build_object('acoes', p_acoes, 'tarefas_criadas', to_jsonb(v_tarefa_ids)),
    NOW()
  )
  ON CONFLICT (mentorado_trilha_id, etapa_slug)
    DO UPDATE SET
      status = 'done',
      resposta = EXCLUDED.resposta,
      completed_at = NOW();

  RETURN jsonb_build_object('tarefas_criadas', to_jsonb(v_tarefa_ids));
END;
$$;

GRANT EXECUTE ON FUNCTION submit_plano_acao(UUID, TEXT, TEXT, JSONB) TO authenticated;
