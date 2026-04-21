'use client';

import { useState, useTransition, useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { completeEtapa, saveResposta } from '@/lib/trilhas/actions';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';

interface Config {
  itens: Array<{ id: string; label: string; com_input?: boolean }>;
  permitir_concluir_parcial?: boolean;
}

export default function ChecklistWidget({ trilhaSlug, etapa, resposta }: WidgetProps) {
  const cfg = etapa.config as unknown as Config;
  const initial = (resposta?.resposta ?? {}) as {
    marcados?: string[];
    inputs?: Record<string, string>;
  };
  const [marcados, setMarcados] = useState<string[]>(initial.marcados ?? []);
  const [inputs, setInputs] = useState<Record<string, string>>(initial.inputs ?? {});
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = resposta?.status === 'done';

  useEffect(() => {
    if (done) return;
    if (marcados.length === 0 && Object.keys(inputs).length === 0) return;
    const timer = setTimeout(() => {
      void saveResposta({
        trilhaSlug,
        etapaSlug: etapa.slug,
        resposta: { marcados, inputs },
      }).catch((e) => console.error('[auto-save]', e));
    }, 800);
    return () => clearTimeout(timer);
  }, [marcados, inputs, trilhaSlug, etapa.slug, done]);

  const toggle = (id: string) => {
    setMarcados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const todosMarcados = cfg.itens.every((i) => marcados.includes(i.id));
  const canComplete =
    todosMarcados || (cfg.permitir_concluir_parcial && marcados.length > 0);

  function concluir() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({
          trilhaSlug,
          etapaSlug: etapa.slug,
          resposta: { marcados, inputs },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 flex flex-col gap-3">
        {cfg.itens.map((item) => {
          const checked = marcados.includes(item.id);
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => !done && toggle(item.id)}
                disabled={done}
                className="flex items-start gap-3 text-left w-full hover:bg-[#F7F8FC] rounded-lg p-2 -mx-2 disabled:cursor-default"
              >
                {checked ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-[#94a3b8] shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-sm ${checked ? 'text-[#0f172a] font-medium' : 'text-[#64748b]'}`}
                >
                  {item.label}
                </span>
              </button>
              {item.com_input && checked && (
                <textarea
                  value={inputs[item.id] ?? ''}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  disabled={done}
                  placeholder="Notas…"
                  className="ml-8 mt-1 w-[calc(100%-2rem)] text-sm text-[#0f172a] border border-[#e2e8f0] rounded-lg p-2 focus:border-[#1E88E5] outline-none disabled:opacity-60"
                  rows={2}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6">
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
        {!done && !canComplete && (
          <p className="text-[#94a3b8] text-xs mt-2">
            {cfg.permitir_concluir_parcial
              ? 'Marque ao menos 1 item para concluir.'
              : 'Marque todos os itens para concluir.'}
          </p>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}
