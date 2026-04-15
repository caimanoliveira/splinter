"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase";
import type { Checkin } from "@/types/portal";

const moods = [
  { value: "energized", label: "Energizado",  emoji: "⚡", color: "border-green-400 bg-green-50 text-green-700" },
  { value: "neutral",   label: "Neutro",      emoji: "😐", color: "border-[#e2e8f0] bg-[#F7F8FC] text-[#64748b]" },
  { value: "stuck",     label: "Travado",     emoji: "🧱", color: "border-red-300 bg-red-50 text-red-600" },
  { value: "anxious",   label: "Ansioso",     emoji: "😰", color: "border-yellow-300 bg-yellow-50 text-yellow-700" },
] as const;

type Mood = typeof moods[number]["value"];

const scoreLabels: Record<number, string> = {
  1: "Nenhuma", 2: "Muito baixa", 3: "Baixa", 4: "Razoável", 5: "Média",
  6: "Boa", 7: "Alta", 8: "Muito alta", 9: "Quase total", 10: "Total",
};

function formatRelative(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "ontem";
  return `${diff} dias atrás`;
}

export default function CheckinPage() {
  const [mentoradoId, setMentoradoId] = useState<string | null>(null);
  const [history, setHistory] = useState<Checkin[]>([]);
  const [form, setForm] = useState({ clarity_score: 5, confidence_score: 5, mood: "neutral" as Mood, wins: "", blockers: "", notes: "" });
  const [saving, startSave] = useTransition();
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: m } = await supabase.from("mentorados").select("id").eq("user_id", user.id).single();
      if (!m) return;
      setMentoradoId(m.id);
      const { data } = await supabase.from("checkins").select("*").eq("mentorado_id", m.id).order("created_at", { ascending: false }).limit(10);
      setHistory((data ?? []) as Checkin[]);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mentoradoId) return;
    startSave(async () => {
      const supabase = createClient();
      await supabase.from("checkins").insert({
        mentorado_id: mentoradoId,
        clarity_score: form.clarity_score,
        confidence_score: form.confidence_score,
        mood: form.mood,
        wins: form.wins || null,
        blockers: form.blockers || null,
        notes: form.notes || null,
      });
      setDone(true);
      const { data } = await supabase.from("checkins").select("*").eq("mentorado_id", mentoradoId).order("created_at", { ascending: false }).limit(10);
      setHistory((data ?? []) as Checkin[]);
    });
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-2xl font-extrabold text-[#0f172a] mb-2">Check-in registrado</h2>
        <p className="text-[#64748b] text-sm mb-6">Seu mentor pode ver este registro. Continue assim.</p>
        <button
          onClick={() => { setDone(false); setForm({ clarity_score: 5, confidence_score: 5, mood: "neutral", wins: "", blockers: "", notes: "" }); }}
          className="text-[#1E88E5] text-sm font-semibold hover:underline"
        >
          Fazer outro check-in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">Continuidade</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Check-in</h1>
        <p className="text-[#64748b] text-sm mt-1">2 minutos. Sem julgamento. Só honestidade.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Humor */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
          <p className="font-bold text-[#0f172a] text-sm mb-3">Como você está agora?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {moods.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, mood: m.value }))}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  form.mood === m.value ? m.color + " ring-2 ring-offset-1 ring-[#1E88E5]" : "border-[#e2e8f0] bg-[#F7F8FC] text-[#64748b] hover:border-[#1E88E5]/40"
                }`}
              >
                <span className="text-xl">{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clareza */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-[#0f172a] text-sm">Clareza na decisão</p>
            <div className="text-right">
              <span className="text-xl font-extrabold text-[#0f172a]">{form.clarity_score}</span>
              <span className="text-[#94a3b8] text-xs">/10</span>
            </div>
          </div>
          <p className="text-[#1E88E5] text-xs font-medium mb-3">{scoreLabels[form.clarity_score]}</p>
          <input
            type="range" min={1} max={10} step={1}
            value={form.clarity_score}
            onChange={e => setForm(prev => ({ ...prev, clarity_score: parseInt(e.target.value) }))}
            className="w-full accent-[#1E88E5]"
          />
          <div className="flex justify-between text-[10px] text-[#94a3b8] mt-0.5">
            <span>1 — Nenhuma</span><span>10 — Total</span>
          </div>
        </div>

        {/* Confiança */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-[#0f172a] text-sm">Confiança para agir</p>
            <div className="text-right">
              <span className="text-xl font-extrabold text-[#0f172a]">{form.confidence_score}</span>
              <span className="text-[#94a3b8] text-xs">/10</span>
            </div>
          </div>
          <p className="text-[#F97316] text-xs font-medium mb-3">{scoreLabels[form.confidence_score]}</p>
          <input
            type="range" min={1} max={10} step={1}
            value={form.confidence_score}
            onChange={e => setForm(prev => ({ ...prev, confidence_score: parseInt(e.target.value) }))}
            className="w-full accent-[#F97316]"
          />
          <div className="flex justify-between text-[10px] text-[#94a3b8] mt-0.5">
            <span>1 — Nenhuma</span><span>10 — Total</span>
          </div>
        </div>

        {/* Vitórias */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
          <p className="font-bold text-[#0f172a] text-sm mb-1">Vitórias desde a última sessão</p>
          <p className="text-[#94a3b8] text-xs mb-3">O que avançou? Pode ser pequeno.</p>
          <textarea
            rows={2}
            value={form.wins}
            onChange={e => setForm(prev => ({ ...prev, wins: e.target.value }))}
            placeholder="Ex: Conversei com 2 pessoas da área que quero entrar…"
            className="w-full text-sm text-[#0f172a] placeholder-[#94a3b8] border border-[#e2e8f0] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E88E5] resize-none"
          />
        </div>

        {/* Travas */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
          <p className="font-bold text-[#0f172a] text-sm mb-1">O que está te travando?</p>
          <p className="text-[#94a3b8] text-xs mb-3">Sem filtro. O mentor vai ver isso antes da próxima sessão.</p>
          <textarea
            rows={2}
            value={form.blockers}
            onChange={e => setForm(prev => ({ ...prev, blockers: e.target.value }))}
            placeholder="Ex: Não consigo avançar no LinkedIn porque não sei como me posicionar…"
            className="w-full text-sm text-[#0f172a] placeholder-[#94a3b8] border border-[#e2e8f0] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E88E5] resize-none"
          />
        </div>

        {/* Notas livres */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5">
          <p className="font-bold text-[#0f172a] text-sm mb-1">Algo mais? <span className="text-[#94a3b8] font-normal">(opcional)</span></p>
          <textarea
            rows={2}
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Qualquer coisa que queira registrar…"
            className="w-full text-sm text-[#0f172a] placeholder-[#94a3b8] border border-[#e2e8f0] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E88E5] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-[#1E88E5] hover:bg-[#1565C0] disabled:opacity-60 text-white font-extrabold py-4 rounded-full transition-colors text-sm"
        >
          {saving ? "Registrando…" : "Registrar check-in"}
        </button>
      </form>

      {/* Histórico */}
      {history.length > 0 && (
        <div className="mt-10">
          <p className="text-[#64748b] text-xs font-semibold uppercase tracking-widest mb-3">Histórico</p>
          <div className="flex flex-col gap-3">
            {history.map(c => {
              const mood = moods.find(m => m.value === c.mood);
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex gap-4 items-start">
                  <span className="text-xl shrink-0">{mood?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-[#64748b]">Clareza: <strong className="text-[#0f172a]">{c.clarity_score}/10</strong></span>
                      <span className="text-xs text-[#64748b]">Confiança: <strong className="text-[#0f172a]">{c.confidence_score}/10</strong></span>
                      <span className="text-xs text-[#94a3b8]">{formatRelative(c.created_at)}</span>
                    </div>
                    {c.wins && <p className="text-xs text-green-700 mt-1.5">✓ {c.wins}</p>}
                    {c.blockers && <p className="text-xs text-red-500 mt-1">⚠ {c.blockers}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
