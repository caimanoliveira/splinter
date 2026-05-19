"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase";
import type { Canvas } from "@/types/portal";

const dimensions = [
  { key: "context",       label: "1. Contexto da decisão",    placeholder: "Qual é a decisão que precisa ser tomada? Qual é o prazo? O que a torna difícil?", color: "#1E88E5" },
  { key: "criteria",      label: "2. Critérios explícitos",   placeholder: "O que você precisa que seja verdade para a decisão estar certa? Quais são seus critérios inegociáveis?", color: "#1E88E5" },
  { key: "constraints",   label: "3. Restrições reais",       placeholder: "O que limita suas opções de verdade? (financeiro, família, tempo, contrato, mercado…)", color: "#64748b" },
  { key: "invisible_vars",label: "4. Variáveis invisíveis",   placeholder: "O que você normalmente ignora mas que provavelmente vai importar? (qualidade do gestor, cultura de decisão, custo emocional…)", color: "#F97316" },
  { key: "value_patterns",label: "5. Padrões de valor",       placeholder: "O que já provou que te energiza? O que já provou que te drena? Quais escolhas passadas você se arrependeu?", color: "#F97316" },
  { key: "possibilities", label: "6. Espaço de possibilidades",placeholder: "Quais são os caminhos reais disponíveis? Liste sem julgar primeiro.", color: "#1E88E5" },
  { key: "scenarios",     label: "7. Cenários e trade-offs",  placeholder: "Se escolher A, o que você ganha e perde? E se escolher B? Use 'se… então…'.", color: "#64748b" },
] as const;


const helpContent: Record<string, { definition: string; questions: string[]; example: string }> = {
  context: {
    definition: "O ponto de partida: qual decisão está em jogo, quando precisa ser tomada e o que a torna difícil.",
    questions: ["Qual é exatamente a decisão que preciso tomar?", "Qual é o prazo real ou percebido?", "O que tornaria isso uma decisão fácil?"],
    example: "Ex: 'Decido até 30/05 se aceito a proposta da empresa X ou peço promoção onde estou. É difícil porque as duas opções têm vantagens reais.'"
  },
  criteria: {
    definition: "Os filtros que qualquer opção boa precisa passar. São suas linhas inegociáveis.",
    questions: ["O que precisa ser verdade para a decisão estar certa?", "Quais critérios são inegociáveis vs. desejáveis?", "Se só um critério pudesse ser atendido, qual seria?"],
    example: "Ex: 'Inegociáveis: salário mínimo R$12k, trabalho remoto pelo menos 3x/semana. Desejáveis: liderança técnica, stack moderna.'"
  },
  constraints: {
    definition: "As restrições reais que limitam suas opções — não as percebidas, as reais.",
    questions: ["Qual é minha real margem financeira para arriscar?", "Quais compromissos familiares ou pessoais não posso ignorar?", "O que o mercado me permite ou impede agora?"],
    example: "Ex: 'Tenho reserva de 4 meses. Filha começa escola em março — mudança de cidade só depois. CNPJ ativo facilita negociação como PJ.'"
  },
  invisible_vars: {
    definition: "As variáveis que quase ninguém analisa mas que frequentemente decidem se você vai ser feliz na escolha.",
    questions: ["Como é o gestor direto que me lideraria?", "Qual é a cultura de decisão da empresa — centralizada ou descentralizada?", "Qual o custo emocional de cada opção no dia a dia?"],
    example: "Ex: 'No emprego A, o gestor microgerencia — isso me drena. No B, há incerteza de funding — gera ansiedade constante que eu subestimei antes.'"
  },
  value_patterns: {
    definition: "O que a sua própria história revela sobre o que te energiza e o que te drena.",
    questions: ["Quais escolhas passadas me deram mais energia no trabalho?", "O que em projetos anteriores me fez querer largar tudo?", "Que tipo de ambiente tira meu melhor?"],
    example: "Ex: 'Sempre fui mais feliz em empresas pequenas com autonomia. No banco grande fiquei 1 ano e pedi demissão. Isso me diz algo.'"
  },
  possibilities: {
    definition: "Os caminhos reais disponíveis — incluindo os não óbvios que você pode estar ignorando.",
    questions: ["Quais são as opções que eu já sei que existem?", "Existe uma terceira via que eu não estou considerando?", "O que mudaria se eu tivesse 10 anos a mais de experiência?"],
    example: "Ex: 'Opções: (A) aceitar oferta, (B) pedir promoção, (C) negociar contraproposta com A para usar como alavanca em B, (D) freelance por 6 meses enquanto exploro.'"
  },
  scenarios: {
    definition: "A análise de trade-offs: o que você ganha e perde em cada caminho.",
    questions: ["Se eu escolher A, o que ganho e o que abro mão?", "Qual cenário eu conseguiria reverter se der errado?", "Em qual opção eu me arrependeria menos daqui a 5 anos?"],
    example: "Ex: 'Se A: ganho salário, perco autonomia e crescimento técnico. Se B: mantenho segurança, arriscos ficar estagnado. Se C: mais incerteza, mais aprendizado.'"
  },
};

export default function CanvasPage() {
  const [canvasList, setCanvasList] = useState<Canvas[]>([]);
  const [active, setActive] = useState<Canvas | null>(null);
  const [form, setForm] = useState<Partial<Canvas>>({});
  const [mentoradoId, setMentoradoId] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const [creating, startCreate] = useTransition();
  const [openHelp, setOpenHelp] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: m } = await supabase.from("mentorados").select("id").eq("user_id", user.id).single();
      if (!m) return;
      setMentoradoId(m.id);

      const { data } = await supabase
        .from("canvas")
        .select("*")
        .eq("mentorado_id", m.id)
        .order("created_at", { ascending: false });

      const list = (data ?? []) as Canvas[];
      setCanvasList(list);

      const current = list.find(c => c.status === "active") ?? list[0] ?? null;
      setActive(current);
      setForm(current ?? {});
    }
    load();
  }, []);

  function setField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!active || !mentoradoId) return;
    startSave(async () => {
      const supabase = createClient();
      await supabase.from("canvas").update({
        title: form.title,
        context: form.context,
        criteria: form.criteria,
        constraints: form.constraints,
        invisible_vars: form.invisible_vars,
        value_patterns: form.value_patterns,
        possibilities: form.possibilities,
        scenarios: form.scenarios,
        final_decision: form.final_decision,
      }).eq("id", active.id);

      const { data } = await supabase.from("canvas").select("*").eq("mentorado_id", mentoradoId).order("created_at", { ascending: false });
      const list = (data ?? []) as Canvas[];
      setCanvasList(list);
      setActive(list.find(c => c.id === active.id) ?? list[0]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  async function handleNew() {
    if (!mentoradoId) return;
    startCreate(async () => {
      const supabase = createClient();
      const nextVersion = (canvasList[0]?.version_number ?? 0) + 1;

      // Archive current active
      if (active) {
        await supabase.from("canvas").update({ status: "archived" }).eq("id", active.id);
      }

      const { data } = await supabase.from("canvas").insert({
        mentorado_id: mentoradoId,
        version_number: nextVersion,
        title: `Canvas v${nextVersion}`,
        status: "active",
      }).select().single();

      if (data) {
        const newCanvas = data as Canvas;
        setCanvasList(prev => [newCanvas, ...prev]);
        setActive(newCanvas);
        setForm(newCanvas);
      }
    });
  }

  function selectCanvas(c: Canvas) {
    setActive(c);
    setForm(c);
    setSaved(false);
  }

  const fillPercent = active
    ? Math.round(
        (dimensions.filter(d => !!(form as Record<string, unknown>)[d.key]).length / dimensions.length) * 100
      )
    : 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[#F97316] text-xs font-semibold tracking-widest uppercase mb-1">Decision Canvas</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Estruture sua decisão</h1>
          <p className="text-[#64748b] text-sm mt-1">7 dimensões para tomar decisões com método, não no impulso.</p>
        </div>
        <button
          onClick={handleNew}
          disabled={creating}
          className="shrink-0 bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
        >
          {creating ? "Criando…" : "+ Nova versão"}
        </button>
      </div>

      {/* Version selector */}
      {canvasList.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {canvasList.map(c => (
            <button
              key={c.id}
              onClick={() => selectCanvas(c)}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                active?.id === c.id
                  ? "bg-[#0f172a] text-white border-[#0f172a]"
                  : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#0f172a]"
              }`}
            >
              v{c.version_number} {c.status === "active" ? "● " : ""}{c.title}
            </button>
          ))}
        </div>
      )}

      {!active && canvasList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
          <p className="text-[#64748b] text-sm mb-4">Nenhum canvas criado ainda.</p>
          <button
            onClick={handleNew}
            disabled={creating}
            className="bg-[#F97316] hover:bg-[#EA6B00] text-white font-bold px-6 py-2.5 rounded-full text-sm transition-colors"
          >
            Criar meu primeiro Canvas
          </button>
        </div>
      ) : active ? (
        <>
          {/* Canvas title + progress */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <input
                value={form.title ?? ""}
                onChange={e => setField("title", e.target.value)}
                className="flex-1 font-bold text-[#0f172a] text-lg bg-transparent border-b border-dashed border-[#e2e8f0] focus:outline-none focus:border-[#1E88E5] pb-0.5"
                placeholder="Título da decisão"
              />
              <span className="shrink-0 text-xs text-[#64748b]">{fillPercent}% preenchido</span>
            </div>
            <div className="h-1.5 bg-[#F7F8FC] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1E88E5] to-[#F97316] transition-all duration-500"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          {/* 7 Dimensions */}
          <div className="flex flex-col gap-4">
            {dimensions.map(({ key, label, placeholder, color }) => (
              <div key={key} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-[#e2e8f0] flex items-center gap-2">
                  <div className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <p className="font-bold text-[#0f172a] text-sm flex-1">{label}</p>
                  <button
                    type="button"
                    onClick={() => setOpenHelp(openHelp === key ? null : key)}
                    className="w-6 h-6 rounded-full border border-[#e2e8f0] bg-[#F7F8FC] hover:bg-[#e2e8f0] text-[#64748b] text-xs font-bold flex items-center justify-center transition-colors shrink-0"
                    aria-label={`Ajuda para ${label}`}
                  >
                    ?
                  </button>
                </div>
                {openHelp === key && (
                  <div className="px-5 py-4 bg-[#F7F8FC] border-b border-[#e2e8f0] text-sm">
                    <p className="text-[#0f172a] font-medium mb-2">{helpContent[key].definition}</p>
                    <ul className="flex flex-col gap-1 mb-3">
                      {helpContent[key].questions.map((q, i) => (
                        <li key={i} className="text-[#475569] text-xs flex gap-2">
                          <span className="text-[#1E88E5] shrink-0">→</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[#64748b] text-xs italic border-l-2 border-[#1E88E5] pl-3">{helpContent[key].example}</p>
                  </div>
                )}
                <textarea
                  rows={3}
                  value={(form as Record<string, string | null>)[key] ?? ""}
                  onChange={e => setField(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-5 py-3 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none resize-none"
                />
              </div>
            ))}

            {/* Decisão final */}
            <div className="bg-[#0f172a] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-white/10">
                <p className="font-extrabold text-white text-sm">Decisão Final</p>
                <p className="text-[#64748b] text-xs mt-0.5">Só preencha quando estiver pronto. Não apresse.</p>
              </div>
              <textarea
                rows={3}
                value={form.final_decision ?? ""}
                onChange={e => setField("final_decision", e.target.value)}
                placeholder="A decisão que eu tomo é…"
                className="w-full px-5 py-3 text-sm text-white placeholder-[#475569] bg-transparent focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1E88E5] hover:bg-[#1565C0] disabled:opacity-60 text-white font-bold px-8 py-3 rounded-full transition-colors"
            >
              {saving ? "Salvando…" : "Salvar Canvas"}
            </button>
            {saved && <span className="text-green-600 text-sm font-medium">Salvo!</span>}
          </div>

          <p className="text-[#94a3b8] text-xs mt-4">
            O Canvas não dá a resposta certa — garante que você está fazendo as perguntas certas.
          </p>
        </>
      ) : null}
    </div>
  );
}
