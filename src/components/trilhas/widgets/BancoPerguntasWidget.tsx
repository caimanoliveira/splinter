'use client';

import { useState, useTransition, useMemo } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import { completeEtapa, saveResposta } from '@/lib/trilhas/actions';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';
import type { Pergunta } from '@/lib/trilhas/perguntas';

interface Config {
  perguntas: Pergunta[];
  min_favoritas: number;
}

export default function BancoPerguntasWidget({ trilhaSlug, etapa, resposta }: WidgetProps) {
  const cfg = etapa.config as unknown as Config;
  const initial = (resposta?.resposta ?? {}) as { favoritas?: string[] };
  const [favoritas, setFavoritas] = useState<string[]>(initial.favoritas ?? []);
  const [cat, setCat] = useState<Pergunta['categoria'] | 'todas'>('todas');
  const [sen, setSen] = useState<'todas' | 'jr' | 'pleno' | 'sr'>('todas');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = resposta?.status === 'done';

  const filtradas = useMemo(() => {
    return cfg.perguntas.filter((p) => {
      if (cat !== 'todas' && p.categoria !== cat) return false;
      if (sen !== 'todas' && !p.senioridade.includes(sen)) return false;
      return true;
    });
  }, [cfg.perguntas, cat, sen]);

  const toggle = (id: string) => {
    const novo = favoritas.includes(id) ? favoritas.filter((x) => x !== id) : [...favoritas, id];
    setFavoritas(novo);
    if (!done) {
      void saveResposta({ trilhaSlug, etapaSlug: etapa.slug, resposta: { favoritas: novo } }).catch((e) => console.error('[auto-save]', e));
    }
  };

  const canComplete = favoritas.length >= cfg.min_favoritas;

  function concluir() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({ trilhaSlug, etapaSlug: etapa.slug, resposta: { favoritas } });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Chip active={cat === 'todas'} onClick={() => setCat('todas')}>Todas</Chip>
          <Chip active={cat === 'behavioral'} onClick={() => setCat('behavioral')}>Behavioral</Chip>
          <Chip active={cat === 'produto'} onClick={() => setCat('produto')}>Produto</Chip>
          <Chip active={cat === 'case'} onClick={() => setCat('case')}>Case</Chip>
          <Chip active={cat === 'lideranca'} onClick={() => setCat('lideranca')}>Liderança</Chip>
          <span className="w-px bg-[#e2e8f0] mx-1" />
          <Chip active={sen === 'todas'} onClick={() => setSen('todas')}>Qualquer</Chip>
          <Chip active={sen === 'jr'} onClick={() => setSen('jr')}>Jr</Chip>
          <Chip active={sen === 'pleno'} onClick={() => setSen('pleno')}>Pleno</Chip>
          <Chip active={sen === 'sr'} onClick={() => setSen('sr')}>Sr</Chip>
        </div>
        <p className="text-[#64748b] text-xs mb-3">
          {favoritas.length} favoritada(s) · mínimo {cfg.min_favoritas}
        </p>
        <ul className="flex flex-col gap-2">
          {filtradas.map((p) => {
            const fav = favoritas.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => !done && toggle(p.id)}
                  disabled={done}
                  className="flex items-start gap-3 text-left w-full border border-[#e2e8f0] rounded-lg p-3 hover:border-[#1E88E5]/40 transition disabled:cursor-default"
                >
                  <Star className={`w-4 h-4 shrink-0 mt-0.5 ${fav ? 'fill-orange-500 text-orange-500' : 'text-[#94a3b8]'}`} />
                  <div>
                    <p className="text-sm text-[#0f172a]">{p.texto}</p>
                    <p className="text-[#94a3b8] text-xs mt-1">
                      {p.categoria} · {p.senioridade.join(', ')}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
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
          <p className="text-[#94a3b8] text-xs mt-2">Favorite pelo menos {cfg.min_favoritas} perguntas para avançar.</p>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${active ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#1E88E5]/40'}`}
    >
      {children}
    </button>
  );
}
