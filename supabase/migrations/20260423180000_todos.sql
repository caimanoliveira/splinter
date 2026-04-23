-- =============================================
-- Agents Todos Dashboard
-- Tabela para tracking de tarefas atribuídas a agentes, consumida
-- pelo dashboard em tempo real em /agents. Realtime habilitado via
-- supabase_realtime publication para que mutations sejam refletidas
-- instantaneamente na UI sem reload.
-- =============================================

CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'p2'
    CHECK (priority IN ('p0', 'p1', 'p2', 'p3')),
  assigned_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_assigned_agent ON todos(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_todos_updated_at ON todos(updated_at DESC);

-- Mantém updated_at coerente em qualquer UPDATE (inclusive quando o agente
-- muda só o status sem mexer nas outras colunas).
CREATE OR REPLACE FUNCTION todos_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS todos_set_updated_at ON todos;
CREATE TRIGGER todos_set_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION todos_touch_updated_at();

-- Habilita Realtime. Adicionar à publication `supabase_realtime` é o que
-- permite que o cliente JS receba INSERT/UPDATE/DELETE via websocket.
ALTER PUBLICATION supabase_realtime ADD TABLE todos;

-- RLS ligado. A policy aqui é permissiva para leitura (dashboard é um
-- painel interno usando a chave anon pública); mutations são reservadas
-- ao service_role, que os agentes usam no backend. Ajuste conforme o
-- modelo de autenticação que o projeto adotar depois.
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY todos_select_all ON todos
  FOR SELECT
  USING (true);
