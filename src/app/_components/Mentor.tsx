const milestones = [
  { year: "USP", event: "Formação em Administração pela Universidade de São Paulo" },
  { year: "9 cidades", event: "Trajetória por diferentes regiões do Brasil — cada cidade, uma decisão de carreira" },
  { year: "Tech", event: "Transição para produto e tecnologia, atuando em startups e empresas de crescimento acelerado" },
  { year: "+50", event: "Primeiras mentorias com profissionais em transição — desenvolvimento do Decision Canvas" },
  { year: "Amazon", event: "Senior Product Manager na Amazon, liderando produto em contextos de alta ambiguidade" },
  { year: "Hoje", event: "Mentoria Carreira & Decisão — ajudando profissionais sêniors de tech a decidir com clareza" },
];

export function Mentor() {
  return (
    <section className="bg-white px-4 py-20" aria-label="Quem é o mentor">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-3">
            Quem mentora
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] mb-4">
            Uma jornada de algumas transições
          </h2>
          <p className="text-[#64748b]">
            Do interior do Brasil à Amazon — passando por 9 cidades no meio do caminho.
          </p>
        </div>

        {/* Photo + bio */}
        <div className="flex flex-col sm:flex-row gap-8 items-start mb-14">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-[#e2e8f0] overflow-hidden shrink-0 mx-auto sm:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/foto-caiman.jpg"
              alt="Caiman Oliveira — Senior PM Amazon e mentor de carreira"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-extrabold text-[#0f172a] text-2xl">Caiman Oliveira</h3>
              <p className="text-[#1E88E5] font-semibold text-sm mt-1">Senior Product Manager · Amazon</p>
            </div>
            <p className="text-[#64748b] leading-relaxed">
              Eu trabalho com produto e carreira do mesmo jeito: clareza, trade-offs e execução.
              A mentoria não é para te motivar — é para te dar direção.
            </p>
            <p className="text-[#0f172a] font-semibold italic">
              &ldquo;Autonomia, não dependência.&rdquo;
            </p>
          </div>
        </div>

        {/* Impact metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {[
            { n: "+50", label: "profissionais mentorados" },
            { n: "9", label: "cidades, múltiplas transições" },
            { n: "Amazon", label: "Senior PM" },
            { n: "USP", label: "Administração" },
          ].map(({ n, label }) => (
            <div key={label} className="bg-[#F7F8FC] rounded-xl p-4 text-center border border-[#e2e8f0]">
              <p className="font-extrabold text-[#0f172a] text-xl">{n}</p>
              <p className="text-[#64748b] text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative flex flex-col gap-0">
          <div className="absolute left-[52px] top-3 bottom-3 w-px bg-[#e2e8f0]" aria-hidden="true" />
          {milestones.map(({ year, event }) => (
            <div key={year} className="flex items-start gap-4 pb-6 last:pb-0">
              <div className="w-[52px] shrink-0 text-right">
                <span className="text-[#1E88E5] text-xs font-bold tracking-wide whitespace-nowrap">
                  {year}
                </span>
              </div>
              <div className="relative mt-0.5">
                <div className="w-3 h-3 rounded-full bg-[#1E88E5] border-2 border-white shadow-sm" />
              </div>
              <p className="text-[#0f172a] text-sm leading-relaxed flex-1 pt-0">{event}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
