import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import { getTrilhaComProgresso } from '@/lib/trilhas/queries';
import { createClient } from '@/lib/supabase-server';
import type { EtapaStatus } from '@/types/portal';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TrilhaOverviewPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getTrilhaComProgresso(slug);
  if (!data || !data.mentorado_trilha) notFound();
  const { trilha, proxima_etapa_slug, etapas_done, etapas_total, mentorado_trilha } = data;

  const supabase = await createClient();
  const { data: respostas } = await supabase
    .from('etapa_respostas')
    .select('etapa_slug, status')
    .eq('mentorado_trilha_id', mentorado_trilha.id);
  const byEtapa = new Map<string, EtapaStatus>();
  (respostas ?? []).forEach((r) => byEtapa.set(r.etapa_slug, r.status as EtapaStatus));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/portal/trilhas" className="text-[#64748b] text-xs hover:text-[#1E88E5]">
          ← Trilhas
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-2">
          {trilha.titulo}
        </h1>
        <p className="text-[#64748b] text-sm mt-2 leading-relaxed">{trilha.descricao}</p>
        <p className="text-[#94a3b8] text-xs mt-3">
          {etapas_done} de {etapas_total} etapas concluídas
        </p>
      </div>

      {proxima_etapa_slug && (
        <Link
          href={`/portal/trilhas/${trilha.slug}/${proxima_etapa_slug}`}
          className="flex items-center gap-2 bg-[#1E88E5] text-white font-semibold text-sm px-5 py-3 rounded-full hover:bg-[#1976D2] transition mb-8 w-fit"
        >
          <PlayCircle className="w-4 h-4" />
          {mentorado_trilha.started_at ? 'Continuar' : 'Iniciar trilha'}
        </Link>
      )}

      <ol className="flex flex-col gap-2">
        {trilha.etapas.map((etapa, i) => {
          const status = byEtapa.get(etapa.slug) ?? 'pending';
          return (
            <li key={etapa.slug}>
              <Link
                href={`/portal/trilhas/${trilha.slug}/${etapa.slug}`}
                className="flex items-start gap-3 bg-white rounded-xl border border-[#e2e8f0] p-4 hover:border-[#1E88E5]/40 transition"
              >
                {status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-[#94a3b8] shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#94a3b8] font-semibold">Etapa {i + 1}</p>
                  <p className="font-semibold text-sm text-[#0f172a]">{etapa.titulo}</p>
                  <p className="text-[#64748b] text-xs mt-1 leading-relaxed">
                    {etapa.descricao}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
