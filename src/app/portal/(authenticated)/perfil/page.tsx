import { createClient } from "@/lib/supabase-server";
import type { Mentorado, MentoradoStatus, Sessao } from "@/types/portal";

function formatDatePtBR(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const statusConfig: Record<MentoradoStatus, { label: string; classes: string }> = {
  active:    { label: "Ativa",      classes: "bg-green-100 text-green-700" },
  paused:    { label: "Pausada",    classes: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Concluída",  classes: "bg-slate-100 text-slate-600" },
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const mentoradoRes = await supabase
    .from("mentorados")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const mentorado = mentoradoRes.data as Mentorado | null;

  if (!mentorado) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-[#64748b]">Perfil de mentorado não encontrado.</p>
        <p className="text-[#94a3b8] text-xs mt-1">Entre em contato com seu mentor.</p>
      </div>
    );
  }

  const sessoesRes = await supabase
    .from("sessoes")
    .select("*")
    .eq("mentorado_id", mentorado.id)
    .order("date", { ascending: false });

  const sessoes = (sessoesRes.data ?? []) as Sessao[];

  const totalSessoes = mentorado.product_name?.includes("Travessia") ? 4 : 1;
  const status = statusConfig[mentorado.status] ?? statusConfig.active;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">
          Meu Perfil
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
          {mentorado.name || "Mentorado"}
        </h1>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {/* Identity section */}
        <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-start justify-between gap-4">
          <div>
            <p className="text-xl font-extrabold text-[#0f172a]">{mentorado.name}</p>
            <p className="text-[#64748b] text-sm mt-0.5">{mentorado.email}</p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.classes}`}
          >
            {status.label}
          </span>
        </div>

        {/* Details grid */}
        <div className="divide-y divide-[#f1f5f9]">
          <div className="grid grid-cols-2 gap-0 divide-x divide-[#f1f5f9]">
            <div className="px-6 py-4">
              <p className="text-[#94a3b8] text-xs font-semibold uppercase tracking-widest mb-1">
                Produto
              </p>
              <p className="text-[#0f172a] text-sm font-semibold">
                {mentorado.product_name || "—"}
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-[#94a3b8] text-xs font-semibold uppercase tracking-widest mb-1">
                Sessões
              </p>
              <p className="text-[#0f172a] text-sm font-semibold">
                {sessoes.length}
                <span className="text-[#94a3b8] font-normal">
                  /{totalSessoes} realizadas
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 divide-x divide-[#f1f5f9]">
            <div className="px-6 py-4">
              <p className="text-[#94a3b8] text-xs font-semibold uppercase tracking-widest mb-1">
                Início
              </p>
              <p className="text-[#0f172a] text-sm">{formatDatePtBR(mentorado.start_date)}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-[#94a3b8] text-xs font-semibold uppercase tracking-widest mb-1">
                Término
              </p>
              <p className="text-[#0f172a] text-sm">{formatDatePtBR(mentorado.end_date)}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {mentorado.notes && (
          <div className="px-6 py-4 border-t border-[#e2e8f0]">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-700 text-xs font-semibold uppercase tracking-widest mb-1">
                Observações
              </p>
              <p className="text-amber-900 text-sm leading-relaxed">{mentorado.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
