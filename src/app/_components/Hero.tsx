const WA_LINK = "https://wa.me/5511940347276";

export function Hero() {
  return (
    <section
      className="bg-[#0f172a] text-white px-4 pt-20 pb-24"
      aria-label="Apresentação"
    >
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-7">
        {/* Credencial imediata */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase">
          <span className="bg-[#1E88E5]/10 text-[#1E88E5] border border-[#1E88E5]/20 px-3 py-1 rounded-full">
            Senior PM na Amazon
          </span>
          <span className="bg-white/5 text-[#94a3b8] border border-white/10 px-3 py-1 rounded-full">
            USP
          </span>
          <span className="bg-white/5 text-[#94a3b8] border border-white/10 px-3 py-1 rounded-full">
            +50 profissionais mentorados
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
          Profissionais sêniors em tech não travam por falta de competência.{" "}
          <span className="text-[#1E88E5]">Travam por falta de clareza nas variáveis certas.</span>
        </h1>

        <p className="text-[#94a3b8] text-lg leading-relaxed max-w-2xl">
          Senior PM na Amazon. Já fiz algumas transições de carreira. Hoje ajudo PMs, designers,
          engenheiros e analistas sêniors a construir o posicionamento certo e tomar decisões de
          carreira com clareza — usando o{" "}
          <strong className="text-white">Decision Canvas</strong>, metodologia que desenvolvi ao
          longo de dezenas de mentorias.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-base px-6 py-4 rounded-full transition-colors flex-1"
          >
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.852L0 24l6.335-1.508A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.49-5.19-1.352l-.37-.214-3.762.896.953-3.67-.242-.384A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
            Sessão diagnóstico gratuita
          </a>
          <a
            href="#servicos"
            className="flex items-center justify-center text-[#94a3b8] hover:text-white border border-white/10 hover:border-white/20 font-medium text-base px-6 py-4 rounded-full transition-colors"
          >
            Ver serviços
          </a>
        </div>

        <p className="text-[#475569] text-sm">
          Primeira sessão de diagnóstico gratuita · Sem compromisso
        </p>

        <a href="#para-voce" className="text-[#475569] hover:text-[#94a3b8] text-sm transition-colors mt-2">
          ↓ Isso foi feito pra você se…
        </a>
      </div>
    </section>
  );
}
