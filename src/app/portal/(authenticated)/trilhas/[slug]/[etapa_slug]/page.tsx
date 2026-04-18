import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTrilhaComProgresso, getEtapaResposta } from '@/lib/trilhas/queries';
import { startTrilhaIfNeeded } from '@/lib/trilhas/actions';
import { widgetRegistry } from '@/lib/trilhas/widgets-registry';
import { createClient } from '@/lib/supabase-server';
import type { EtapaResposta, TrilhaSlug } from '@/types/portal';

interface PageProps {
  params: Promise<{ slug: string; etapa_slug: string }>;
}

export default async function EtapaPlayerPage({ params }: PageProps) {
  const { slug, etapa_slug } = await params;
  const data = await getTrilhaComProgresso(slug);
  if (!data || !data.mentorado_trilha) notFound();

  const { trilha, mentorado_trilha } = data;
  const etapaIdx = trilha.etapas.findIndex((e) => e.slug === etapa_slug);
  if (etapaIdx === -1) notFound();
  const etapa = trilha.etapas[etapaIdx];

  await startTrilhaIfNeeded(trilha.slug as TrilhaSlug);
  const resposta = await getEtapaResposta(mentorado_trilha.id, etapa.slug);

  const supabase = await createClient();
  const { data: todasRespostas } = await supabase
    .from('etapa_respostas')
    .select('*')
    .eq('mentorado_trilha_id', mentorado_trilha.id);
  const contextoTrilhaRespostas = (todasRespostas ?? []) as EtapaResposta[];

  const Widget = widgetRegistry[etapa.tipo];

  const prev = etapaIdx > 0 ? trilha.etapas[etapaIdx - 1] : null;
  const next = etapaIdx < trilha.etapas.length - 1 ? trilha.etapas[etapaIdx + 1] : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/portal/trilhas/${trilha.slug}`}
          className="text-[#64748b] text-xs hover:text-[#1E88E5]"
        >
          ← {trilha.titulo}
        </Link>
        <p className="text-xs text-[#94a3b8] font-semibold mt-3">
          Etapa {etapaIdx + 1} de {trilha.etapas.length}
        </p>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a]">{etapa.titulo}</h1>
        <p className="text-[#64748b] text-sm mt-2 leading-relaxed">{etapa.descricao}</p>
      </div>

      {Widget ? (
        <Widget
          trilhaSlug={trilha.slug as TrilhaSlug}
          etapa={etapa}
          resposta={resposta}
          contextoTrilhaRespostas={contextoTrilhaRespostas}
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 text-center">
          <p className="text-[#94a3b8] text-sm">
            Widget &quot;{etapa.tipo}&quot; ainda não implementado.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#e2e8f0]">
        {prev ? (
          <Link
            href={`/portal/trilhas/${trilha.slug}/${prev.slug}`}
            className="flex items-center gap-1 text-[#64748b] text-sm hover:text-[#1E88E5]"
          >
            <ChevronLeft className="w-4 h-4" /> {prev.titulo}
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/portal/trilhas/${trilha.slug}/${next.slug}`}
            className="flex items-center gap-1 text-[#64748b] text-sm hover:text-[#1E88E5] ml-auto"
          >
            {next.titulo} <ChevronRight className="w-4 h-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
