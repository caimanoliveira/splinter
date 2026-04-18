import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getTrilhasAtribuidas, type TrilhaComProgresso } from '@/lib/trilhas/queries';

export default async function TrilhasPage() {
  const trilhas = await getTrilhasAtribuidas();

  const emAndamento = trilhas.filter(
    (t) => t.mentorado_trilha?.started_at && !t.mentorado_trilha?.completed_at
  );
  const naoIniciadas = trilhas.filter((t) => !t.mentorado_trilha?.started_at);
  const concluidas = trilhas.filter((t) => t.mentorado_trilha?.completed_at);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">
          Metodologia
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Trilhas</h1>
        <p className="text-[#64748b] text-sm mt-1">
          Jornadas guiadas que você executa entre sessões com o mentor.
        </p>
      </div>

      {trilhas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
          <p className="text-[#64748b] text-sm">
            O mentor ainda não atribuiu trilhas a você.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {emAndamento.length > 0 && <Section title="Em andamento" items={emAndamento} />}
          {naoIniciadas.length > 0 && <Section title="Não iniciadas" items={naoIniciadas} />}
          {concluidas.length > 0 && <Section title="Concluídas" items={concluidas} />}
        </div>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: TrilhaComProgresso[] }) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-widest uppercase text-[#64748b] mb-3">
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((t) => (
          <Link
            key={t.trilha.slug}
            href={`/portal/trilhas/${t.trilha.slug}`}
            className="group bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 hover:border-[#1E88E5]/40 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-sm text-[#0f172a]">{t.trilha.titulo}</p>
                <p className="text-[#64748b] text-xs mt-1 leading-relaxed">
                  {t.trilha.descricao}
                </p>
                <p className="text-[#94a3b8] text-xs mt-2">
                  {t.etapas_done} de {t.etapas_total} etapas concluídas
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#94a3b8] group-hover:text-[#1E88E5] transition shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
