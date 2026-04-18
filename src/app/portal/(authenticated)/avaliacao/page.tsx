"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase";
import type { Competencia, AvaliacaoCompetencia } from "@/types/portal";

const scoreLabels: Record<number, string> = {
  1: "Muito baixo",
  2: "Baixo",
  3: "Abaixo da média",
  4: "Razoável",
  5: "Médio",
  6: "Acima da média",
  7: "Bom",
  8: "Muito bom",
  9: "Excelente",
  10: "Excepcional",
};

function HistoricoLinhaChart({ competencias, avaliacoes }: { competencias: Competencia[]; avaliacoes: AvaliacaoCompetencia[] }) {
  const W = 300; const H = 60; const PAD = 4;

  const toX = (i: number, n: number) => PAD + (i / Math.max(n - 1, 1)) * (W - PAD * 2);
  const toY = (s: number) => PAD + ((10 - s) / 9) * (H - PAD * 2);

  const series = competencias.map((comp) => {
    const points = avaliacoes
      .filter((a) => a.competencia_id === comp.id)
      .sort((a, b) => a.assessed_at.localeCompare(b.assessed_at))
      .map((a) => ({
        date: new Date(a.assessed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        score: a.score,
      }));
    return { name: comp.name, points };
  }).filter((s) => s.points.length >= 2);

  if (series.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 mb-6">
      <div className="mb-4">
        <p className="font-bold text-[#0f172a] text-sm">Histórico por Competência</p>
        <p className="text-[#64748b] text-xs mt-0.5">Evolução completa ao longo das avaliações</p>
      </div>
      <div className="flex flex-col gap-5">
        {series.map(({ name, points }) => {
          const n = points.length;
          const delta = points[n - 1].score - points[0].score;
          const polyPoints = points.map((p, i) => `${toX(i, n)},${toY(p.score)}`).join(" ");
          return (
            <div key={name}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-[#475569] font-medium truncate flex-1 pr-2">{name}</p>
                <span className={`text-xs font-bold shrink-0 ${delta > 0 ? "text-green-600" : delta < 0 ? "text-red-500" : "text-[#94a3b8]"}`}>
                  {delta > 0 ? `+${delta}` : delta === 0 ? "=" : delta}
                </span>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 48 }} aria-hidden="true">
                {[1, 5, 10].map((s) => (
                  <line key={s} x1={PAD} y1={toY(s)} x2={W - PAD} y2={toY(s)} stroke="#f1f5f9" strokeWidth={1} />
                ))}
                <polyline points={polyPoints} fill="none" stroke="#1E88E5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                  <circle key={i} cx={toX(i, n)} cy={toY(p.score)} r={3}
                    fill={i === n - 1 ? "#1E88E5" : "white"} stroke="#1E88E5" strokeWidth={2} />
                ))}
              </svg>
              <div className="flex justify-between text-[9px] text-[#94a3b8] mt-0.5">
                <span>{points[0].date}</span>
                <span>{points[n - 1].date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EvolucaoChart({ competencias, avaliacoes }: { competencias: Competencia[]; avaliacoes: AvaliacaoCompetencia[] }) {
  const data = competencias.map((comp) => {
    const history = avaliacoes
      .filter((a) => a.competencia_id === comp.id)
      .sort((a, b) => a.assessed_at.localeCompare(b.assessed_at));
    if (history.length < 2) return null;
    return {
      name: comp.name,
      first: history[0].score,
      latest: history[history.length - 1].score,
      delta: history[history.length - 1].score - history[0].score,
    };
  }).filter(Boolean) as { name: string; first: number; latest: number; delta: number }[];

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-[#0f172a] text-sm">Evolução das Competências</p>
          <p className="text-[#64748b] text-xs mt-0.5">Comparativo: primeira vs. última avaliação</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#64748b]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0] inline-block" /> Início</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#1E88E5] inline-block" /> Atual</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {data.map(({ name, first, latest, delta }) => (
          <div key={name}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#475569] font-medium truncate flex-1 pr-2">{name}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-xs font-bold ${delta > 0 ? "text-green-600" : delta < 0 ? "text-red-500" : "text-[#94a3b8]"}`}>
                  {delta > 0 ? `+${delta}` : delta === 0 ? "=" : delta}
                </span>
                <span className="text-[#0f172a] text-xs font-extrabold">{latest}<span className="text-[#94a3b8] font-normal">/10</span></span>
              </div>
            </div>
            <div className="relative h-2.5 bg-[#F7F8FC] rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#e2e8f0]"
                style={{ width: `${(first / 10) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#1E88E5] to-[#1565C0] transition-all duration-500"
                style={{ width: `${(latest / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  return (
    <div className="h-2 bg-[#F7F8FC] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#1E88E5] to-[#F97316] transition-all duration-500"
        style={{ width: `${(score / max) * 100}%` }}
      />
    </div>
  );
}

export default function AvaliacaoPage() {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoCompetencia[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [mentoradoId, setMentoradoId] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [compRes, mentoradoRes] = await Promise.all([
        supabase.from("competencias").select("*").order("order"),
        supabase.from("mentorados").select("id").eq("user_id", user.id).single(),
      ]);

      if (compRes.data) setCompetencias(compRes.data);
      if (mentoradoRes.data) {
        setMentoradoId(mentoradoRes.data.id);

        // Latest score per competencia
        const { data: avals } = await supabase
          .from("avaliacoes_competencia")
          .select("*")
          .eq("mentorado_id", mentoradoRes.data.id)
          .order("assessed_at", { ascending: false });

        if (avals) {
          setAvaliacoes(avals);
          // Pre-fill with most recent score per competencia
          const latestScores: Record<string, number> = {};
          const latestNotes: Record<string, string> = {};
          for (const a of avals) {
            if (!latestScores[a.competencia_id]) {
              latestScores[a.competencia_id] = a.score;
              latestNotes[a.competencia_id] = a.notes ?? "";
            }
          }
          setScores(latestScores);
          setNotes(latestNotes);
        }
      }
    }
    load();
  }, []);

  async function handleSave() {
    if (!mentoradoId) return;
    setError(null);
    startSaving(async () => {
      const supabase = createClient();
      const rows = Object.entries(scores).map(([competencia_id, score]) => ({
        mentorado_id: mentoradoId,
        competencia_id,
        score,
        notes: notes[competencia_id] ?? null,
        assessed_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from("avaliacoes_competencia")
        .insert(rows);

      if (insertError) {
        setError("Erro ao salvar. Tente novamente.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      // Refresh avaliacoes
      const { data: updated } = await supabase
        .from("avaliacoes_competencia")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .order("assessed_at", { ascending: false });
      if (updated) setAvaliacoes(updated);
    });
  }

  // Group history by competencia for mini chart
  function getHistory(competenciaId: string) {
    return avaliacoes
      .filter((a) => a.competencia_id === competenciaId)
      .slice(0, 5)
      .reverse();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">Autoavaliação</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Avaliação de Competências</h1>
        <p className="text-[#64748b] text-sm mt-1">
          Avalie suas competências de 1 a 10. Seja honesto — é para você, não para impressionar.
        </p>
      </div>

      <EvolucaoChart competencias={competencias} avaliacoes={avaliacoes} />
      <HistoricoLinhaChart competencias={competencias} avaliacoes={avaliacoes} />

      {competencias.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
          <p className="text-[#64748b] text-sm">Carregando competências…</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-5">
            {competencias.map((comp) => {
              const currentScore = scores[comp.id] ?? 0;
              const history = getHistory(comp.id);
              return (
                <div key={comp.id} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-bold text-[#0f172a] text-sm">{comp.name}</p>
                      {comp.description && (
                        <p className="text-[#64748b] text-xs mt-0.5">{comp.description}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-2xl font-extrabold text-[#0f172a]">
                        {currentScore > 0 ? currentScore : "—"}
                      </span>
                      <span className="text-[#94a3b8] text-xs">/10</span>
                    </div>
                  </div>

                  <ScoreBar score={currentScore} />

                  {currentScore > 0 && (
                    <p className="text-[#1E88E5] text-xs font-medium mt-1.5">{scoreLabels[currentScore]}</p>
                  )}

                  {/* Slider */}
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={currentScore > 0 ? currentScore : 5}
                    onChange={(e) =>
                      setScores((prev) => ({ ...prev, [comp.id]: parseInt(e.target.value) }))
                    }
                    className="w-full mt-3 accent-[#1E88E5]"
                    aria-label={`Nota para ${comp.name}`}
                  />

                  <div className="flex justify-between text-[10px] text-[#94a3b8] mt-0.5 mb-3">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>

                  {/* History dots */}
                  {history.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-[#94a3b8] text-[10px]">Histórico:</span>
                      {history.map((h, i) => (
                        <span
                          key={h.id}
                          title={`${h.score}/10 em ${new Date(h.assessed_at).toLocaleDateString("pt-BR")}`}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: `hsl(${(h.score / 10) * 120}, 60%, 50%)` }}
                        >
                          {h.score}
                        </span>
                      ))}
                    </div>
                  )}

                  <textarea
                    rows={2}
                    placeholder="Notas / contexto (opcional)"
                    value={notes[comp.id] ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [comp.id]: e.target.value }))
                    }
                    className="w-full text-xs text-[#0f172a] placeholder-[#94a3b8] border border-[#e2e8f0] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent resize-none"
                  />
                </div>
              );
            })}
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl mt-4">{error}</p>
          )}

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving || Object.keys(scores).length === 0}
              className="bg-[#1E88E5] hover:bg-[#1565C0] disabled:opacity-60 text-white font-bold px-8 py-3 rounded-full transition-colors"
            >
              {saving ? "Salvando…" : "Salvar avaliação"}
            </button>
            {saved && (
              <span className="text-green-600 text-sm font-medium">Salvo com sucesso!</span>
            )}
          </div>

          <p className="text-[#94a3b8] text-xs mt-4 leading-relaxed">
            Cada envio cria um registro histórico. Você pode reavaliar a qualquer momento.
          </p>
        </>
      )}
    </div>
  );
}
