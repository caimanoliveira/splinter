import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import type { TrilhaComProgresso } from '@/lib/trilhas/queries';

export function DashboardTrilhaCard({ data }: { data: TrilhaComProgresso }) {
  const pct =
    data.etapas_total === 0 ? 0 : Math.round((data.etapas_done / data.etapas_total) * 100);
  const href = data.proxima_etapa_slug
    ? `/portal/trilhas/${data.trilha.slug}/${data.proxima_etapa_slug}`
    : `/portal/trilhas/${data.trilha.slug}`;
  return (
    <Link
      href={href}
      className="block bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 hover:border-[#1E88E5]/40 transition"
    >
      <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">
        Trilha em andamento
      </p>
      <p className="font-semibold text-sm text-[#0f172a]">{data.trilha.titulo}</p>
      <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full mt-3">
        <div
          className="h-full bg-[#1E88E5] rounded-full transition"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[#64748b] text-xs mt-2">
        {data.etapas_done}/{data.etapas_total} etapas · {pct}%
      </p>
      <div className="flex items-center gap-1 text-[#1E88E5] text-sm font-semibold mt-3">
        <PlayCircle className="w-4 h-4" /> Continuar
      </div>
    </Link>
  );
}
