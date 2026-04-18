import { createClient } from "@/lib/supabase-server";
import type { Mentorado } from "@/types/portal";
import IndicarClient from "./IndicarClient";

export default async function IndicarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("mentorados")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  const mentorado = data as Pick<Mentorado, "id" | "name"> | null;
  if (!mentorado) return null;

  const referralUrl = `https://splinter-yhcm.vercel.app/?ref=${mentorado.id}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">Indicações</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Indique um amigo</h1>
        <p className="text-[#64748b] text-sm mt-1">
          Conhece alguém travado numa decisão de carreira? Compartilhe seu link exclusivo.
        </p>
      </div>

      <IndicarClient name={mentorado.name} referralUrl={referralUrl} />

      <div className="mt-6 bg-[#F7F8FC] rounded-2xl border border-[#e2e8f0] p-5">
        <p className="text-[#0f172a] font-bold text-sm mb-2">Como funciona</p>
        <ol className="flex flex-col gap-2 text-[#64748b] text-sm">
          <li className="flex gap-2"><span className="text-[#1E88E5] font-bold shrink-0">1.</span> Compartilhe o link com alguém que está enfrentando uma decisão difícil de carreira.</li>
          <li className="flex gap-2"><span className="text-[#1E88E5] font-bold shrink-0">2.</span> Quando ela entrar em contato e fechar, seu mentor saberá que foi você quem indicou.</li>
          <li className="flex gap-2"><span className="text-[#1E88E5] font-bold shrink-0">3.</span> Você recebe um agradecimento especial — combinado direto com o mentor.</li>
        </ol>
      </div>
    </div>
  );
}
