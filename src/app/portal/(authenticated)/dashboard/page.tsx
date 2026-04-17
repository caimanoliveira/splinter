import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import type { Mentorado, Tarefa, Sessao, Checkin, Marco } from "@/types/portal";
import OnboardingBanner from "../_components/OnboardingBanner";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const moodConfig: Record<string, { label: string; color: string }> = {
  energized: { label: "Energizado", color: "text-green-600" },
  neutral:   { label: "Neutro",     color: "text-[#64748b]" },
  stuck:     { label: "Travado",    color: "text-red-500" },
  anxious:   { label: "Ansioso",    color: "text-yellow-600" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const mentoradoRes = await supabase.from("mentorados").select("*").eq("user_id", user.id).single();
  const mentorado = mentoradoRes.data as Mentorado | null;

  if (!mentorado) return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <p className="text-[#64748b]">Perfil de mentorado não encontrado.</p>
      <p className="text-[#94a3b8] text-xs mt-1">Entre em contato com seu mentor.</p>
    </div>
  );

  const mid = mentorado.id;
  const [sessoesR, tarefasR, checkinsR, marcosR, canvasCountR, checkinCountR] = await Promise.all([
    supabase.from("sessoes").select("*").eq("mentorado_id", mid).order("date", { ascending: false }).limit(5),
    supabase.from("tarefas").select("*").eq("mentorado_id", mid).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("checkins").select("*").eq("mentorado_id", mid).order("created_at", { ascending: false }).limit(1),
    supabase.from("marcos").select("*").eq("mentorado_id", mid).order("order", { ascending: true }),
    supabase.from("canvas").select("id", { count: "exact", head: true }).eq("mentorado_id", mid),
    supabase.from("checkins").select("id", { count: "exact", head: true }).eq("mentorado_id", mid),
  ]);

  const sessoes  = (sessoesR.data  ?? []) as Sessao[];
  const tarefas  = (tarefasR.data  ?? []) as Tarefa[];
  const checkins = (checkinsR.data ?? []) as Checkin[];
  const marcos   = (marcosR.data   ?? []) as Marco[];

  const canvasCount  = canvasCountR.count ?? 0;
  const checkinCount = checkinCountR.count ?? 0;
  const isFirstAccess = canvasCount === 0 && checkinCount === 0;

  const lastCheckin = checkins[0] ?? null;
  const pending = tarefas.filter(t => t.status !== "done");
  const achieved = marcos.filter(m => m.is_achieved).length;
  const totalMarcos = marcos.length;

  // Product tier detection
  const isGrupo     = mentorado.product_name?.toLowerCase().includes("grupo") || mentorado.product_name?.toLowerCase().includes("decisões em contexto");
  const isCheckup   = mentorado.product_name?.toLowerCase().includes("check-up") || mentorado.product_name?.toLowerCase().includes("checkup");
  const totalSessoes = mentorado.product_name?.includes("Travessia") ? 4 : 1;
  const sessoesFeit = sessoes.length;
  const progresso = Math.min(100, Math.round((sessoesFeit / totalSessoes) * 100));

  // Grupo tier: simplified portal
  if (isGrupo) {
    return (
      <div className="max-w-3xl mx-auto">
        {isFirstAccess && <OnboardingBanner />}
        <div className="mb-8">
          <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">Programa em Grupo</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
            Olá{mentorado.name ? `, ${mentorado.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-[#64748b] text-sm mt-1">{mentorado.product_name}</p>
        </div>
        <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-6 text-white border border-[#1E88E5]/20 mb-5">
          <p className="font-extrabold text-base mb-1">Portal do Grupo em breve</p>
          <p className="text-[#94a3b8] text-sm mb-4">
            O espaço dedicado ao seu programa em grupo está sendo preparado. Por enquanto, use o WhatsApp para acompanhar os encontros.
          </p>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
          >
            Acessar grupo no WhatsApp
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/portal/canvas" className="flex items-center justify-between bg-[#F97316] hover:bg-[#EA6B00] text-white rounded-2xl p-5 transition group">
            <div>
              <p className="font-bold text-sm">Decision Canvas</p>
              <p className="text-orange-100 text-xs mt-0.5">Estruture sua decisão de carreira.</p>
            </div>
            <span className="text-white text-lg group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link href="/portal/materiais" className="flex items-center justify-between bg-white border border-[#e2e8f0] hover:border-[#1E88E5]/40 rounded-2xl p-5 transition group">
            <div>
              <p className="font-bold text-sm text-[#0f172a]">Materiais</p>
              <p className="text-[#64748b] text-xs mt-0.5">Recursos do programa.</p>
            </div>
            <span className="text-[#1E88E5] text-lg group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Onboarding banner — shown only on first access */}
      {isFirstAccess && <OnboardingBanner />}

      {/* Header */}
      <div className="mb-8">
        <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">
          {isCheckup ? "Check-up de Decisão" : "Sua Travessia"}
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
          Olá{mentorado.name ? `, ${mentorado.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-[#64748b] text-sm mt-1">{mentorado.product_name || "Mentoria Carreira & Decisão"}</p>
      </div>

      {/* Barra de progresso da travessia */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-[#0f172a] text-sm">Progresso da Travessia</p>
          <span className="text-[#1E88E5] font-extrabold text-sm">{progresso}%</span>
        </div>
        <div className="h-2.5 bg-[#F7F8FC] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1E88E5] to-[#F97316] transition-all duration-700"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <div className="flex gap-4 text-xs text-[#64748b]">
          <span><strong className="text-[#0f172a]">{sessoesFeit}</strong>/{totalSessoes} sessões</span>
          <span><strong className="text-[#0f172a]">{pending.length}</strong> tarefas pendentes</span>
          {totalMarcos > 0 && (
            <span><strong className="text-[#0f172a]">{achieved}</strong>/{totalMarcos} marcos</span>
          )}
        </div>
      </div>

      {/* Cards rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* Clareza */}
        <Link href="/portal/checkin" className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4 hover:border-[#1E88E5]/40 transition group">
          <p className="text-[#64748b] text-xs font-semibold uppercase tracking-widest mb-2">Clareza</p>
          {lastCheckin ? (
            <>
              <p className="text-2xl font-extrabold text-[#0f172a]">{lastCheckin.clarity_score}<span className="text-[#94a3b8] text-xs font-normal">/10</span></p>
              <p className={`text-xs mt-1 font-medium ${moodConfig[lastCheckin.mood]?.color}`}>{moodConfig[lastCheckin.mood]?.label}</p>
            </>
          ) : (
            <p className="text-[#1E88E5] text-xs font-semibold mt-2 group-hover:underline">Fazer check-in →</p>
          )}
        </Link>

        {/* Confiança */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
          <p className="text-[#64748b] text-xs font-semibold uppercase tracking-widest mb-2">Confiança</p>
          {lastCheckin ? (
            <p className="text-2xl font-extrabold text-[#0f172a]">{lastCheckin.confidence_score}<span className="text-[#94a3b8] text-xs font-normal">/10</span></p>
          ) : (
            <p className="text-[#94a3b8] text-xs mt-2">—</p>
          )}
        </div>

        {/* Canvas */}
        <Link href="/portal/canvas" className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4 hover:border-[#F97316]/40 transition group">
          <p className="text-[#64748b] text-xs font-semibold uppercase tracking-widest mb-2">Canvas</p>
          <p className="text-[#F97316] text-xs font-semibold mt-2 group-hover:underline">Abrir →</p>
        </Link>

        {/* Sessões */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
          <p className="text-[#64748b] text-xs font-semibold uppercase tracking-widest mb-2">Sessões</p>
          <p className="text-2xl font-extrabold text-[#0f172a]">{sessoesFeit}</p>
          <p className="text-[#94a3b8] text-xs mt-1">realizadas</p>
        </div>
      </div>

      {/* Marcos da travessia */}
      {marcos.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm mb-5">
          <div className="px-5 py-4 border-b border-[#e2e8f0]">
            <h2 className="font-bold text-[#0f172a] text-sm">Marcos da Travessia</h2>
          </div>
          <div className="px-5 py-4">
            <ol className="relative border-l border-[#e2e8f0] ml-2 flex flex-col gap-4">
              {marcos.map((m) => (
                <li key={m.id} className="ml-4">
                  <div className={`absolute -left-[7px] w-3.5 h-3.5 rounded-full border-2 ${m.is_achieved ? "bg-[#1E88E5] border-[#1E88E5]" : "bg-white border-[#e2e8f0]"}`} />
                  <p className={`text-sm font-semibold ${m.is_achieved ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>{m.title}</p>
                  {m.description && <p className="text-xs text-[#64748b] mt-0.5">{m.description}</p>}
                  {m.achieved_at && <p className="text-xs text-[#1E88E5] mt-0.5">{formatDate(m.achieved_at)}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Tarefas pendentes */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm mb-5">
        <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <h2 className="font-bold text-[#0f172a] text-sm">Próximas Tarefas</h2>
          <Link href="/portal/tarefas" className="text-[#1E88E5] text-xs font-semibold hover:underline">Ver todas →</Link>
        </div>
        {pending.length > 0 ? (
          <ul className="divide-y divide-[#f1f5f9]">
            {pending.slice(0, 4).map(t => (
              <li key={t.id} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === "in_progress" ? "bg-[#1E88E5]" : "bg-[#e2e8f0]"}`} />
                <p className="text-[#0f172a] text-sm flex-1 truncate">{t.title}</p>
                {t.due_date && <p className="text-[#94a3b8] text-xs shrink-0">{formatDate(t.due_date)}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-[#94a3b8] text-sm">Nenhuma tarefa pendente no momento.</p>
            <p className="text-[#64748b] text-xs mt-1">Seu mentor criará tarefas após a próxima sessão.</p>
          </div>
        )}
      </div>

      {/* Última sessão */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm mb-5">
        <div className="px-5 py-4 border-b border-[#e2e8f0]">
          <h2 className="font-bold text-[#0f172a] text-sm">
            {sessoes[0] ? `Última Sessão — ${formatDate(sessoes[0].date)}` : "Última Sessão"}
          </h2>
        </div>
        {sessoes.length > 0 ? (
          <div className="px-5 py-4 flex flex-col gap-3">
            {sessoes[0].summary && (
              <div>
                <p className="text-[#1E88E5] text-xs font-semibold uppercase tracking-widest mb-1">Resumo</p>
                <p className="text-[#0f172a] text-sm leading-relaxed">{sessoes[0].summary}</p>
              </div>
            )}
            {sessoes[0].next_steps && (
              <div>
                <p className="text-[#F97316] text-xs font-semibold uppercase tracking-widest mb-1">Próximos passos</p>
                <p className="text-[#0f172a] text-sm leading-relaxed">{sessoes[0].next_steps}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-[#94a3b8] text-sm">Sua primeira sessão aparecerá aqui.</p>
            <p className="text-[#64748b] text-xs mt-1">Após cada sessão, seu mentor registra o resumo e os próximos passos.</p>
          </div>
        )}
      </div>

      {/* CTAs rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/portal/checkin"
          className="flex items-center justify-between bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-2xl p-5 transition group"
        >
          <div>
            <p className="font-bold text-sm">Check-in de hoje</p>
            <p className="text-[#64748b] text-xs mt-0.5">Como você está? Travas e vitórias.</p>
          </div>
          <span className="text-[#F97316] text-lg group-hover:translate-x-1 transition-transform">→</span>
        </Link>
        <Link
          href="/portal/canvas"
          className="flex items-center justify-between bg-[#F97316] hover:bg-[#EA6B00] text-white rounded-2xl p-5 transition group"
        >
          <div>
            <p className="font-bold text-sm">Decision Canvas</p>
            <p className="text-orange-100 text-xs mt-0.5">Estruture sua decisão de carreira.</p>
          </div>
          <span className="text-white text-lg group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
}
