'use client';

import { useState, useTransition, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { completeEtapa, saveResposta } from '@/lib/trilhas/actions';
import { getMatriz } from '@/lib/trilhas/matrizes';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';

interface Config {
  matriz_ref: 'pm-ladder' | 'lideranca' | 'selectable';
  opcoes?: Array<'pm-ladder' | 'lideranca'>;
  modo: 'avaliacao' | 'gap';
  fonte_avaliacao_etapa_slug?: string;
}

type Resposta = {
  matriz_slug?: 'pm-ladder' | 'lideranca';
  niveis_atuais?: Record<string, number>;
  niveis_alvo?: Record<string, number>;
};

export default function MatrizWidget(props: WidgetProps) {
  const cfg = props.etapa.config as unknown as Config;
  if (cfg.modo === 'gap') return <GapView {...props} />;
  return <AvaliacaoView {...props} />;
}

function AvaliacaoView({ trilhaSlug, etapa, resposta }: WidgetProps) {
  const cfg = etapa.config as unknown as Config;
  const initial = (resposta?.resposta ?? {}) as Resposta;
  const [matrizSlug, setMatrizSlug] = useState<'pm-ladder' | 'lideranca' | undefined>(
    initial.matriz_slug ?? (cfg.matriz_ref !== 'selectable' ? cfg.matriz_ref : undefined)
  );
  const [niveisAtuais, setNiveisAtuais] = useState<Record<string, number>>(initial.niveis_atuais ?? {});
  const [niveisAlvo, setNiveisAlvo] = useState<Record<string, number>>(initial.niveis_alvo ?? {});
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = resposta?.status === 'done';

  useEffect(() => {
    if (done || !matrizSlug) return;
    const timer = setTimeout(() => {
      void saveResposta({
        trilhaSlug,
        etapaSlug: etapa.slug,
        resposta: { matriz_slug: matrizSlug, niveis_atuais: niveisAtuais, niveis_alvo: niveisAlvo },
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [matrizSlug, niveisAtuais, niveisAlvo, done, trilhaSlug, etapa.slug]);

  if (cfg.matriz_ref === 'selectable' && !matrizSlug) {
    const opcoes = cfg.opcoes ?? ['pm-ladder', 'lideranca'];
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <p className="font-semibold text-sm text-[#0f172a] mb-3">Escolha a matriz de competências:</p>
        <div className="flex flex-col gap-2">
          {opcoes.map((slug) => {
            const m = getMatriz(slug);
            return (
              <button
                key={slug}
                onClick={() => setMatrizSlug(slug)}
                className="flex items-start gap-3 text-left border border-[#e2e8f0] rounded-lg p-3 hover:border-[#1E88E5]/40 transition"
              >
                <div>
                  <p className="font-semibold text-sm text-[#0f172a]">{m.titulo}</p>
                  <p className="text-[#64748b] text-xs mt-1">
                    Níveis: {m.niveis.map((n) => n.nome).join(' → ')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!matrizSlug) return null;
  const matriz = getMatriz(matrizSlug);
  const todasPreenchidas = matriz.competencias.every(
    (c) => niveisAtuais[c.id] !== undefined && niveisAlvo[c.id] !== undefined
  );

  function concluir() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({
          trilhaSlug,
          etapaSlug: etapa.slug,
          resposta: { matriz_slug: matrizSlug, niveis_atuais: niveisAtuais, niveis_alvo: niveisAlvo },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <p className="text-xs font-semibold text-[#64748b] tracking-widest uppercase mb-2">{matriz.titulo}</p>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 overflow-x-auto">
        {matriz.competencias.length === 0 ? (
          <p className="text-[#94a3b8] text-sm">Matriz ainda não possui competências definidas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-semibold text-[#0f172a] pb-3 pr-3">Competência</th>
                {matriz.niveis.map((n) => (
                  <th key={n.id} className="text-center font-semibold text-[#64748b] px-2 pb-3 text-xs">
                    {n.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matriz.competencias.map((c) => (
                <tr key={c.id} className="border-t border-[#e2e8f0]">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-[#0f172a]">{c.nome}</p>
                    <p className="text-[#94a3b8] text-xs">{c.descricao}</p>
                  </td>
                  {matriz.niveis.map((n) => {
                    const atual = niveisAtuais[c.id] === n.id;
                    const alvo = niveisAlvo[c.id] === n.id;
                    return (
                      <td key={n.id} className="text-center px-1 py-3">
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            onClick={() => !done && setNiveisAtuais((p) => ({ ...p, [c.id]: n.id }))}
                            disabled={done}
                            className={`w-6 h-6 rounded-full border-2 transition ${atual ? 'bg-[#1E88E5] border-[#1E88E5]' : 'border-[#e2e8f0] hover:border-[#1E88E5]/40'}`}
                            title="Nível atual"
                          />
                          <button
                            onClick={() => !done && setNiveisAlvo((p) => ({ ...p, [c.id]: n.id }))}
                            disabled={done}
                            className={`w-6 h-6 rounded border-2 transition ${alvo ? 'bg-orange-500 border-orange-500' : 'border-[#e2e8f0] hover:border-orange-300'}`}
                            title="Nível alvo"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex gap-4 mt-4 text-xs text-[#64748b]">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#1E88E5]" /> Nível atual
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-orange-500" /> Nível alvo
          </span>
        </div>
      </div>
      <div className="mt-6">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Concluído
          </div>
        ) : (
          <button
            onClick={concluir}
            disabled={pending || !todasPreenchidas || matriz.competencias.length === 0}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Salvando…' : 'Concluir auto-avaliação'}
          </button>
        )}
        {!done && matriz.competencias.length > 0 && !todasPreenchidas && (
          <p className="text-[#94a3b8] text-xs mt-2">Marque nível atual e alvo de todas as competências.</p>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}

function GapView({ trilhaSlug, etapa, resposta, contextoTrilhaRespostas }: WidgetProps) {
  const cfg = etapa.config as unknown as Config;
  const fonte = contextoTrilhaRespostas.find((r) => r.etapa_slug === cfg.fonte_avaliacao_etapa_slug);
  const fonteResposta = (fonte?.resposta ?? null) as Resposta | null;
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = resposta?.status === 'done';

  if (!fonteResposta?.matriz_slug) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 text-center">
        <p className="text-[#94a3b8] text-sm">Complete a etapa de auto-avaliação primeiro.</p>
      </div>
    );
  }

  const matriz = getMatriz(fonteResposta.matriz_slug);
  const gaps = matriz.competencias
    .map((c) => {
      const atual = fonteResposta.niveis_atuais?.[c.id] ?? 0;
      const alvo = fonteResposta.niveis_alvo?.[c.id] ?? 0;
      return { competencia: c, atual, alvo, gap: Math.max(0, alvo - atual) };
    })
    .sort((a, b) => b.gap - a.gap);
  const maxGap = Math.max(1, ...gaps.map((g) => g.gap));

  function confirmar() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({
          trilhaSlug,
          etapaSlug: etapa.slug,
          resposta: { confirmado_em: new Date().toISOString() },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <p className="text-xs font-semibold text-[#64748b] tracking-widest uppercase mb-3">Seus gaps, ordenados</p>
        {gaps.length === 0 ? (
          <p className="text-[#94a3b8] text-sm">Matriz ainda não possui competências.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {gaps.map((g) => (
              <div key={g.competencia.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-[#0f172a]">{g.competencia.nome}</span>
                  <span className="text-[#94a3b8]">{g.atual} → {g.alvo} (gap {g.gap})</span>
                </div>
                <div className="w-full h-2 bg-[#F7F8FC] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition"
                    style={{ width: `${(g.gap / maxGap) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-6">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Concluído
          </div>
        ) : (
          <button
            onClick={confirmar}
            disabled={pending}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Salvando…' : 'Entendi, próximo passo'}
          </button>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}
