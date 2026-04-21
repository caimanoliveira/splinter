'use client';

import { useState, useTransition, useEffect } from 'react';
import { CheckCircle2, Download } from 'lucide-react';
import { completeEtapa, saveResposta } from '@/lib/trilhas/actions';
import { PERGUNTAS_ENTREVISTA } from '@/lib/trilhas/perguntas';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';

interface Config {
  min_completos: number;
  fonte_favoritas_etapa_slug: string;
}

interface Star { s: string; t: string; a: string; r: string }

export default function StarBuilderWidget({ trilhaSlug, etapa, resposta, contextoTrilhaRespostas }: WidgetProps) {
  const cfg = etapa.config as unknown as Config;
  const done = resposta?.status === 'done';

  const fonte = contextoTrilhaRespostas.find((r) => r.etapa_slug === cfg.fonte_favoritas_etapa_slug);
  const favoritas = ((fonte?.resposta ?? {}) as { favoritas?: string[] }).favoritas ?? [];

  const initial = (resposta?.resposta ?? {}) as { stars?: Record<string, Star> };
  const [stars, setStars] = useState<Record<string, Star>>(initial.stars ?? {});
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => {
      void saveResposta({ trilhaSlug, etapaSlug: etapa.slug, resposta: { stars } }).catch((e) => console.error('[auto-save]', e));
    }, 1500);
    return () => clearTimeout(timer);
  }, [stars, done, trilhaSlug, etapa.slug]);

  if (favoritas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 text-center">
        <p className="text-[#94a3b8] text-sm">Favorite perguntas na etapa anterior primeiro.</p>
      </div>
    );
  }

  const completos = Object.values(stars).filter((s) => s.s && s.t && s.a && s.r).length;
  const canComplete = completos >= cfg.min_completos;

  function updateStar(pid: string, field: keyof Star, value: string) {
    setStars((prev) => ({
      ...prev,
      [pid]: { ...(prev[pid] ?? { s: '', t: '', a: '', r: '' }), [field]: value },
    }));
  }

  function concluir() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({ trilhaSlug, etapaSlug: etapa.slug, resposta: { stars } });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <p className="text-[#64748b] text-xs mb-3">
        {completos} completos · mínimo {cfg.min_completos} (todos 4 campos preenchidos)
      </p>
      <div className="flex flex-col gap-4">
        {favoritas.map((pid) => {
          const pergunta = PERGUNTAS_ENTREVISTA.find((p) => p.id === pid);
          if (!pergunta) return null;
          const star = stars[pid] ?? { s: '', t: '', a: '', r: '' };
          return (
            <div key={pid} className="bg-white rounded-xl border border-[#e2e8f0] p-5">
              <p className="font-semibold text-sm text-[#0f172a] mb-3">{pergunta.texto}</p>
              {(['s', 't', 'a', 'r'] as const).map((f) => (
                <div key={f} className="mb-2">
                  <label className="text-xs font-semibold text-[#64748b] tracking-widest uppercase">
                    {f === 's' ? 'Situação' : f === 't' ? 'Tarefa' : f === 'a' ? 'Ação' : 'Resultado'}
                  </label>
                  <textarea
                    value={star[f]}
                    onChange={(e) => updateStar(pid, f, e.target.value)}
                    disabled={done}
                    rows={f === 'a' ? 4 : 2}
                    className="w-full text-sm text-[#0f172a] border border-[#e2e8f0] rounded p-2 mt-1 focus:border-[#1E88E5] outline-none disabled:opacity-60"
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-3 flex-wrap">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Concluído
          </div>
        ) : (
          <button
            onClick={concluir}
            disabled={pending || !canComplete}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Salvando…' : 'Concluir etapa'}
          </button>
        )}
        {completos > 0 && (
          <a
            href={`/api/exportar-star?trilha=${trilhaSlug}&etapa=${etapa.slug}`}
            className="flex items-center gap-1 text-[#1E88E5] text-sm font-semibold border border-[#1E88E5]/30 hover:bg-blue-50 px-4 py-2 rounded-full"
          >
            <Download className="w-4 h-4" /> Exportar PDF
          </a>
        )}
      </div>
      {!done && !canComplete && (
        <p className="text-[#94a3b8] text-xs mt-2">Preencha os 4 campos em pelo menos {cfg.min_completos} perguntas.</p>
      )}
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
