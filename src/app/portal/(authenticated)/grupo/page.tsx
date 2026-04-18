import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { Material } from "@/types/portal";

export default async function GrupoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mentorado } = await supabase
    .from("mentorados")
    .select("name, product_name")
    .eq("user_id", user.id)
    .single();

  const isGrupo = !!(
    mentorado?.product_name?.toLowerCase().includes("grupo") ||
    mentorado?.product_name?.toLowerCase().includes("decisões em contexto")
  );

  if (!isGrupo) redirect("/portal/dashboard");

  const { data: materiais } = await supabase
    .from("materiais")
    .select("*")
    .eq("is_global", true)
    .order("created_at", { ascending: false });

  const nome = mentorado?.name?.split(" ")[0] ?? "";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">
          Programa em Grupo
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
          Olá{nome ? `, ${nome}` : ""}!
        </h1>
        <p className="text-[#64748b] text-sm mt-1">{mentorado?.product_name}</p>
      </div>

      {/* WhatsApp do grupo */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-6 text-white border border-[#1E88E5]/20 mb-5">
        <p className="font-extrabold text-base mb-1">Comunidade do grupo</p>
        <p className="text-[#94a3b8] text-sm mb-4">
          Acesse o grupo no WhatsApp para acompanhar os encontros, tirar dúvidas e interagir com os outros participantes.
        </p>
        <a
          href="https://wa.me/5511940347276"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Acessar grupo no WhatsApp
        </a>
      </div>

      {/* Materiais do grupo */}
      {(materiais ?? []).length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
          <div className="px-5 py-4 border-b border-[#e2e8f0]">
            <h2 className="font-bold text-[#0f172a] text-sm">Materiais do Programa</h2>
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {(materiais as Material[]).map((m) => (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-5 py-4 hover:bg-[#F7F8FC] transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0f172a] truncate group-hover:text-[#1E88E5] transition-colors">
                    {m.title}
                  </p>
                  {m.description && (
                    <p className="text-xs text-[#64748b] mt-0.5 truncate">{m.description}</p>
                  )}
                </div>
                <span className="text-[10px] font-bold text-[#94a3b8] uppercase shrink-0">{m.type}</span>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
          <p className="text-[#64748b] text-sm">Nenhum material disponível ainda.</p>
          <p className="text-[#94a3b8] text-xs mt-1">O mentor compartilhará recursos conforme o programa avançar.</p>
        </div>
      )}
    </div>
  );
}
