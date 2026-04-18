import { z } from 'zod';

// ============ config schemas ============

export const conteudoConfigSchema = z.object({
  markdown: z.string(),
});

export const bancoPerguntasConfigSchema = z.object({
  perguntas: z.array(
    z.object({
      id: z.string(),
      texto: z.string(),
      categoria: z.enum(['behavioral', 'produto', 'case', 'lideranca']),
      senioridade: z.array(z.enum(['jr', 'pleno', 'sr'])),
    })
  ),
  min_favoritas: z.number().int().min(1),
});

export const starBuilderConfigSchema = z.object({
  min_completos: z.number().int().min(1),
  fonte_favoritas_etapa_slug: z.string(),
});

export const checklistConfigSchema = z.object({
  itens: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      com_input: z.boolean().optional(),
    })
  ),
  permitir_concluir_parcial: z.boolean().optional(),
});

export const matrizConfigSchema = z.object({
  matriz_ref: z.union([z.enum(['pm-ladder', 'lideranca']), z.literal('selectable')]),
  opcoes: z.array(z.enum(['pm-ladder', 'lideranca'])).optional(),
  modo: z.enum(['avaliacao', 'gap']),
  fonte_avaliacao_etapa_slug: z.string().optional(),
});

export const planoAcaoConfigSchema = z.object({
  fonte_avaliacao_etapa_slug: z.string(),
  n_acoes: z.number().int().min(1).max(5),
});

// ============ resposta schemas ============

export const conteudoRespostaSchema = z.object({
  lido_em: z.string().datetime(),
});

export const bancoPerguntasRespostaSchema = z.object({
  favoritas: z.array(z.string()),
});

export const starBuilderRespostaSchema = z.object({
  stars: z.record(
    z.string(),
    z.object({
      s: z.string(),
      t: z.string(),
      a: z.string(),
      r: z.string(),
    })
  ),
});

export const checklistRespostaSchema = z.object({
  marcados: z.array(z.string()),
  inputs: z.record(z.string(), z.string()).optional(),
});

export const matrizAvaliacaoRespostaSchema = z.object({
  matriz_slug: z.enum(['pm-ladder', 'lideranca']),
  niveis_atuais: z.record(z.string(), z.number().int().min(1).max(4)),
  niveis_alvo: z.record(z.string(), z.number().int().min(1).max(4)),
});

export const matrizGapRespostaSchema = z.object({
  confirmado_em: z.string().datetime(),
});

export const planoAcaoRespostaSchema = z.object({
  acoes: z.array(
    z.object({
      competencia_id: z.string(),
      descricao: z.string().min(1),
      prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data YYYY-MM-DD'),
    })
  ).length(3),
});

export function respostaSchemaFor(tipo: string, modo?: string) {
  switch (tipo) {
    case 'conteudo': return conteudoRespostaSchema;
    case 'banco_perguntas': return bancoPerguntasRespostaSchema;
    case 'star_builder': return starBuilderRespostaSchema;
    case 'checklist': return checklistRespostaSchema;
    case 'matriz': return modo === 'gap' ? matrizGapRespostaSchema : matrizAvaliacaoRespostaSchema;
    case 'plano_acao': return planoAcaoRespostaSchema;
    default: throw new Error(`unknown tipo: ${tipo}`);
  }
}
