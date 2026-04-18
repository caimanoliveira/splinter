export type MentoradoStatus = 'active' | 'completed' | 'paused'
export type MaterialType = 'pdf' | 'video' | 'template' | 'link'
export type TarefaStatus = 'pending' | 'in_progress' | 'done'

export interface Mentorado {
  id: string
  user_id: string | null
  lead_id: string | null
  name: string
  email: string
  product_name: string
  start_date: string | null
  end_date: string | null
  status: MentoradoStatus
  notes: string | null
  created_at: string
}

export interface Material {
  id: string
  title: string
  description: string | null
  type: MaterialType
  url: string
  thumbnail_url: string | null
  is_global: boolean
  created_at: string
}

export interface MentoradoMaterial {
  id: string
  mentorado_id: string
  material_id: string
  unlocked_at: string
  seen_at: string | null
  material?: Material
}

export interface Tarefa {
  id: string
  mentorado_id: string
  title: string
  description: string | null
  due_date: string | null
  status: TarefaStatus
  created_by_mentor: boolean
  completed_at: string | null
  created_at: string
}

export interface Sessao {
  id: string
  mentorado_id: string
  date: string
  duration_min: number
  summary: string | null
  decisions: string | null
  next_steps: string | null
  created_at: string
}

export interface Competencia {
  id: string
  name: string
  description: string | null
  order: number
}

export interface AvaliacaoCompetencia {
  id: string
  mentorado_id: string
  competencia_id: string
  score: number
  notes: string | null
  assessed_at: string
  competencia?: Competencia
}

export type CanvasStatus = 'draft' | 'active' | 'archived'
export type CheckinMood = 'energized' | 'neutral' | 'stuck' | 'anxious'

export interface Canvas {
  id: string
  mentorado_id: string
  version_number: number
  title: string
  context: string | null
  criteria: string | null
  constraints: string | null
  invisible_vars: string | null
  value_patterns: string | null
  possibilities: string | null
  scenarios: string | null
  final_decision: string | null
  status: CanvasStatus
  created_at: string
  updated_at: string
}

export interface Checkin {
  id: string
  mentorado_id: string
  clarity_score: number
  confidence_score: number
  mood: CheckinMood
  wins: string | null
  blockers: string | null
  notes: string | null
  created_at: string
}

export interface Marco {
  id: string
  mentorado_id: string
  title: string
  description: string | null
  order: number
  is_achieved: boolean
  achieved_at: string | null
  created_at: string
}

// ============ Trilhas ============

export type EtapaTipo =
  | 'conteudo'
  | 'banco_perguntas'
  | 'star_builder'
  | 'checklist'
  | 'matriz'
  | 'plano_acao';

export type EtapaStatus = 'pending' | 'in_progress' | 'done';

export type TrilhaSlug = 'preparacao-entrevistas' | 'mapa-competencias';

export interface Etapa {
  slug: string;
  titulo: string;
  descricao: string;
  tipo: EtapaTipo;
  config: Record<string, unknown>;
}

export interface Trilha {
  slug: TrilhaSlug;
  titulo: string;
  descricao: string;
  etapas: Etapa[];
}

export interface MentoradoTrilha {
  id: string;
  mentorado_id: string;
  trilha_slug: TrilhaSlug;
  assigned_at: string;
  assigned_by: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface EtapaResposta {
  id: string;
  mentorado_trilha_id: string;
  etapa_slug: string;
  status: EtapaStatus;
  resposta: Record<string, unknown> | null;
  completed_at: string | null;
  updated_at: string;
}
