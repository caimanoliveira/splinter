'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { submitPlanoAcao } from '@/lib/trilhas/actions';
import { getMatriz } from '@/lib/trilhas/matrizes';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';

interface Config {
  fonte_avaliacao_etapa_slug: string;
  n_acoes: number;
}

interface Acao {
  competencia_id: string;
  descricao: string;
  prazo: string;
}

export default function PlanoAcaoWidget({ trilhaSlug, etapa, resposta, contextoTrilhaRespostas }: WidgetProps) {
  const cfg = etapa.config as unknown as Config;
  const done = resposta?.status === 'done';

  const fonte = contextoTrilhaRespostas.find((r) => r.etapa_slug === cfg.fonte_avaliacao_etapa_slug);
  const fonteResposta = (fonte?.resposta ?? null) as {
    matriz_slug?: 'pm-ladder' | 'lideranca';
    niveis_atuais?: Record<string, number>;
    niveis_alvo?: Record<string, number>;
  } | null;

  const topGaps = fonteResposta?.matriz_slug
    ? getMatriz(fonteResposta.matriz_slug).competencias
        .map((c) => ({
          competencia: c,
          gap: (fonteResposta.niveis_alvo?.[c.id] ?? 0) - (fonteResposta.niveis_atuais?.[c.id] ?? 0),
        }))
        .filter((x) => x.gap > 0)
        .sort((a, b) => b.gap - a.gap)
        .slice(0, cfg.n_acoes)
    : [];

  const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const initialAcoes: Acao[] = done && resposta?.resposta
    ? (resposta.resposta as { acoes: Acao[] }).acoes
    : topGaps.map((g) => ({ competencia_id: g.competencia.id, descricao: '', prazo: inTwoWeeks }));

  const [acoes, setAcoes] = useState<Acao[]>(initialAcoes);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!fonteResposta?.matriz_slug) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 text-center">
        <p className="text-[#94a3b8] text-sm">Complete a etapa de auto-avaliação primeiro.</p>
      </div>
    );
  }

  const matriz = getMatriz(fonteResposta.matriz_slug);

  if (matriz.competencias.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 text-center">
        <p className="text-[#94a3b8] text-sm">Matriz ainda não possui competências.</p>
      </div>
    );
  }

  const podeSubmeter = acoes.length === cfg.n_acoes && acoes.every((a) => a.descricao.trim().length > 0 && a.prazo);

  function submeter() {
    setError(null);
    start(async () => {
      try {
        await submitPlanoAcao({ trilhaSlug, etapaSlug: etapa.slug, acoes });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <p className="text-[#64748b] text-sm mb-4">
          Com base nos seus gaps, escreva {cfg.n_acoes} ações concretas. Cada uma virará uma tarefa em &quot;Tarefas&quot;.
        </p>
        <div className="flex flex-col gap-4">
          {acoes.map((acao, i) => {
            const comp = matriz.competencias.find((c) => c.id === acao.competencia_id);
            return (
              <div key={i} className="border border-[#e2e8f0] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#94a3b8] tracking-widest uppercase">Ação {i + 1}</p>
                  {!done && (
                    <select
                      value={acao.competencia_id}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAcoes((prev) => prev.map((a, idx) => idx === i ? { ...a, competencia_id: v } : a));
                      }}
                      className="text-xs border border-[#e2e8f0] rounded px-2 py-1"
                    >
                      {matriz.competencias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  )}
                  {done && comp && (
                    <span className="text-xs font-medium text-[#0f172a]">{comp.nome}</span>
                  )}
                </div>
                <textarea
                  value={acao.descricao}
                  onChange={(e) => setAcoes((prev) => prev.map((a, idx) => idx === i ? { ...a, descricao: e.target.value } : a))}
                  disabled={done}
                  placeholder="O que você vai fazer?"
                  rows={2}
                  className="w-full text-sm text-[#0f172a] border border-[#e2e8f0] rounded p-2 focus:border-[#1E88E5] outline-none disabled:opacity-60"
                />
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-[#64748b]">Prazo:</label>
                  <input
                    type="date"
                    value={acao.prazo}
                    onChange={(e) => setAcoes((prev) => prev.map((a, idx) => idx === i ? { ...a, prazo: e.target.value } : a))}
                    disabled={done}
                    className="text-sm border border-[#e2e8f0] rounded px-2 py-1 disabled:opacity-60"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-6">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Plano submetido · tarefas criadas em{' '}
            <a href="/portal/tarefas" className="underline">/portal/tarefas</a>
          </div>
        ) : (
          <button
            onClick={submeter}
            disabled={pending || !podeSubmeter}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Gerando tarefas…' : 'Submeter plano'}
          </button>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}
