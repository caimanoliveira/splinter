const FORM_LINK = "#aplicar";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#e2e8f0]">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <div className="grid grid-cols-3 gap-0.5 w-7 h-7">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${i === 4 ? "bg-[#1E88E5]" : "bg-[#0f172a]"}`}
              />
            ))}
          </div>
          <div className="hidden sm:block">
            <p className="font-bold text-[#0f172a] leading-tight text-sm">Caiman Oliveira</p>
            <p className="text-[#64748b] text-xs leading-tight">Mentoria Carreira &amp; Decisão</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#metodo"
            className="hidden sm:block text-sm font-medium text-[#0f172a] hover:text-[#1E88E5] transition-colors px-3 py-2"
          >
            Como funciona
          </a>
          <a
            href={FORM_LINK}
            className="flex items-center gap-1.5 bg-[#F97316] hover:bg-[#EA6B00] text-white font-semibold text-sm px-4 py-2 rounded-full transition-colors"
          >
            Quero decidir
          </a>
        </div>
      </div>
    </header>
  );
}
