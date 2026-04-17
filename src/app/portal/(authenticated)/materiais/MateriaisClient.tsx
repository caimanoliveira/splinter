"use client";

import { useState } from "react";
import type { Material } from "@/types/portal";

function safeUrl(url: string): string {
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : "#";
  } catch {
    return "#";
  }
}

const typeLabels: Record<string, string> = {
  all: "Todos",
  pdf: "PDF",
  video: "Vídeo",
  template: "Template",
  link: "Link",
};

const typeColors: Record<string, string> = {
  pdf: "bg-red-50 text-red-600 border-red-100",
  video: "bg-blue-50 text-[#1E88E5] border-blue-100",
  template: "bg-orange-50 text-[#F97316] border-orange-100",
  link: "bg-[#F7F8FC] text-[#64748b] border-[#e2e8f0]",
};

function TypeIcon({ type }: { type: string }) {
  if (type === "pdf")
    return <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  if (type === "video")
    return <svg className="w-6 h-6 text-[#1E88E5]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
  if (type === "template")
    return <svg className="w-6 h-6 text-[#F97316]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>;
  return <svg className="w-6 h-6 text-[#64748b]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
}

interface MaterialItem {
  material: Material;
  seen_at: string | null;
}

export default function MateriaisClient({ items }: { items: MaterialItem[] }) {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");

  const filtered = items.filter(({ material }) => {
    const matchesType = activeType === "all" || material.type === activeType;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      material.title.toLowerCase().includes(q) ||
      (material.description ?? "").toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const types = ["all", "pdf", "video", "template", "link"] as const;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar materiais…"
          className="flex-1 border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent bg-white"
        />
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                activeType === t
                  ? "bg-[#0f172a] text-white border-[#0f172a]"
                  : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#0f172a]"
              }`}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
          <p className="text-[#64748b] text-sm">Nenhum material encontrado.</p>
          <p className="text-[#94a3b8] text-xs mt-1">Tente outro termo ou filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(({ material, seen_at }) => (
            <a
              key={material.id}
              href={safeUrl(material.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 flex gap-4 hover:border-[#1E88E5]/40 hover:shadow-md transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F7F8FC] border border-[#e2e8f0] flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition">
                <TypeIcon type={material.type} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[#0f172a] font-semibold text-sm leading-snug line-clamp-2">{material.title}</p>
                  {!seen_at && (
                    <span className="shrink-0 text-[10px] font-bold text-white bg-[#1E88E5] px-2 py-0.5 rounded-full">Novo</span>
                  )}
                </div>
                {material.description && (
                  <p className="text-[#64748b] text-xs mt-1 line-clamp-2">{material.description}</p>
                )}
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-2 ${typeColors[material.type]}`}>
                  {typeLabels[material.type]}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
