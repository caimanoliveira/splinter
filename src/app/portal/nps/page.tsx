import { createClient } from "@/lib/supabase-server";

export default async function NpsPage({
  searchParams,
}: {
  searchParams: Promise<{ score?: string; id?: string }>;
}) {
  const { score: scoreStr, id: mentorado_id } = await searchParams;
  const score = parseInt(scoreStr ?? "0");
  const valid = score >= 1 && score <= 10 && !!mentorado_id;

  if (valid) {
    try {
      const supabase = await createClient();
      const { data: existing } = await supabase
        .from("nps_responses")
        .select("id")
        .eq("mentorado_id", mentorado_id)
        .limit(1)
        .maybeSingle();
      if (!existing) {
        await supabase.from("nps_responses").insert({ mentorado_id, score });
      }
    } catch {
      // tabela pode não existir ainda — não bloquear a tela de agradecimento
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
        {valid ? (
          <>
            <p className="text-5xl mb-4">🙏</p>
            <h1 className="text-[#0f172a] font-extrabold text-xl mb-2">
              Obrigado pela resposta!
            </h1>
            <p className="text-[#64748b] text-sm leading-relaxed">
              {score >= 9
                ? `Nota ${score} — fico muito feliz! Isso significa muito para mim.`
                : score >= 7
                ? `Nota ${score} — obrigado! Vou usar esse feedback para melhorar.`
                : `Nota ${score} — obrigado pela honestidade. Seu feedback é valioso.`}
            </p>
          </>
        ) : (
          <>
            <p className="text-4xl mb-4">🔗</p>
            <h1 className="text-[#0f172a] font-extrabold text-xl mb-2">Link inválido</h1>
            <p className="text-[#64748b] text-sm">
              Use o link do email de conclusão para registrar sua avaliação.
            </p>
          </>
        )}

        <a
          href="/portal/dashboard"
          className="mt-6 inline-block bg-[#1E88E5] hover:bg-[#1565C0] text-white font-bold px-6 py-2.5 rounded-full text-sm transition-colors"
        >
          Acessar portal →
        </a>
      </div>
    </div>
  );
}
