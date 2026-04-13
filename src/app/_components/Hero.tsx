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
          Você não está travado por falta de competência.{" "}
          <span className="text-[#F97316]">Está travado por excesso de caminhos sem decisão.</span>
        </h1>

        <p className="text-[#94a3b8] text-lg leading-relaxed max-w-2xl">
          Conduzo a Mentoria Carreira &amp; Decisão para profissionais em dúvida entre ficar,
          mudar de área ou empreender. Em poucas semanas, aplicamos o{" "}
          <strong className="text-white">Decision Canvas</strong> à sua vida real, comparamos
          cenários de carreira e você sai com{" "}
          <strong className="text-white">uma decisão tomada e um plano claro de execução</strong>.
        </p>

        <p className="text-[#F97316] font-semibold tracking-wide text-sm uppercase">
          Não é sobre motivação. É sobre decisão.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA6B00] text-white font-bold text-base px-6 py-4 rounded-full transition-colors flex-1"
          >
            Quero minha sessão diagnóstico
          </a>
          <a
            href="#metodo"
            className="flex items-center justify-center text-[#94a3b8] hover:text-white border border-white/10 hover:border-white/20 font-medium text-base px-6 py-4 rounded-full transition-colors"
          >
            Entender o método
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
