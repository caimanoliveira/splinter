import { createClient } from "@/lib/supabase-server";
import type { MentoradoMaterial, Material } from "@/types/portal";
import MateriaisClient from "./MateriaisClient";

export default async function MateriaisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: pivot } = await supabase
    .from("mentorado_materiais")
    .select("*, material:materiais(*)")
    .order("unlocked_at", { ascending: false });

  const { data: globalMaterials } = await supabase
    .from("materiais")
    .select("*")
    .eq("is_global", true)
    .order("created_at", { ascending: false });

  const assigned = (pivot ?? []) as MentoradoMaterial[];
  const globals = (globalMaterials ?? []) as Material[];

  const assignedIds = new Set(assigned.map((p) => p.material_id));
  const allMaterials = [
    ...assigned.map((p) => ({ material: p.material!, seen_at: p.seen_at })),
    ...globals.filter((g) => !assignedIds.has(g.id)).map((g) => ({ material: g, seen_at: null })),
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">Biblioteca</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Materiais</h1>
        <p className="text-[#64748b] text-sm mt-1">Recursos compartilhados pelo mentor para sua jornada.</p>
      </div>

      {allMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
          <p className="text-[#64748b] text-sm">Nenhum material disponível ainda.</p>
          <p className="text-[#94a3b8] text-xs mt-1">O mentor compartilhará recursos conforme a mentoria avançar.</p>
        </div>
      ) : (
        <MateriaisClient items={allMaterials} />
      )}
    </div>
  );
}
