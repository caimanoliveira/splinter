const WA_LINK = "https://wa.me/5511940347276";

const plans = [
  {
    tier: "Entrada",
    type: "Sessão Única",
    name: "Check-up de Decisão de Carreira",
    price: "R$ 600",
    usd: "/ USD 150",
    desc: "Para quem quer entender por onde começar antes de se comprometer com um programa.",
    features: [
      "1 sessão de 90 minutos, ao vivo",
      "Decision Canvas aplicado à sua situação",
      "Mapa de caminhos possíveis",
      "Identificação da decisão real",
      "Próximo passo concreto ao final",
    ],
    result: "Clareza sobre a decisão + próximo passo executável.",
    cta: "Agendar Check-up",
    ctaStyle: "bg-[#F97316] hover:bg-[#EA6B00] text-white",
    recommended: false,
    note: "Muitos clientes começam aqui e continuam para o Ciclo após ver o que é possível.",
    guarantee: null,
  },
  {
    tier: "Principal",
    type: "Ciclo 1:1",
    name: "Travessia",
    price: "R$ 2.000",
    usd: null,
    desc: "Para profissionais em transição ou com múltiplas decisões conectadas que precisam de acompanhamento.",
    features: [
      "4 sessões estruturadas de 60 minutos",
      "4 a 6 semanas de duração",
      "Decision Canvas completo",
      "Narrativa de carreira + posicionamento LinkedIn",
      "CV alinhado à decisão tomada",
      "Preparação para entrevistas",
      "Plano de 90 dias",
    ],
    result: "Decisão tomada + plano de ação completo.",
    cta: "Quero o Ciclo Travessia",
    ctaStyle: "bg-[#1E88E5] hover:bg-[#1565C0] text-white",
    recommended: true,
    note: null,
    guarantee: "Se até a 2ª sessão você não sentir ganho real de clareza, realinhamos o percurso ou oferecemos uma sessão extra sem custo.",
  },
  {
    tier: "Contínuo",
    type: "Mentoria em Grupo",
    name: "Decisões em Contexto",
    price: "R$ 450",
    usd: "/mês",
    desc: "Para profissionais que querem desenvolvimento contínuo com troca entre pares.",
    features: [
      "Grupo reduzido de 6 a 10 pessoas",
      "2 encontros por mês (90 min cada)",
      "Decisões reais em contexto coletivo",
      "Acesso direto ao mentor",
      "Rede de profissionais em transição",
    ],
    result: "Repertório de decisão + rede de pares.",
    cta: "Entrar na lista de espera",
    ctaStyle: "bg-[#0f172a] hover:bg-[#1e293b] text-white",
    recommended: false,
    note: null,
    guarantee: null,
  },
];

export function Pricing() {
  return (
    <section id="servicos" className="bg-[#F7F8FC] px-4 py-20" aria-label="Como trabalhamos juntos">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-3">
            Serviços
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] mb-4">
            Como trabalhamos juntos
          </h2>
          <p className="text-[#64748b]">
            Escolha o formato que faz sentido para sua situação atual.
          </p>
        </div>
        <div className="flex flex-col gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 sm:p-8 border shadow-sm bg-white ${
                plan.recommended ? "border-[#1E88E5] border-2" : "border-[#e2e8f0]"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#1E88E5] px-4 py-0.5 text-white text-xs font-bold rounded-full whitespace-nowrap">
                  Mais completo
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <span className="text-[#F97316] text-xs font-bold tracking-widest uppercase">
                    {plan.tier}
                  </span>
                  <p className="text-[#64748b] text-xs font-semibold tracking-widest uppercase mt-0.5 mb-1">
                    {plan.type}
                  </p>
                  <h3 className="font-extrabold text-[#0f172a] text-2xl">{plan.name}</h3>
                </div>
                <div className="sm:text-right shrink-0">
                  <p className="text-3xl font-extrabold text-[#0f172a] leading-none">
                    {plan.price}
                    {plan.usd && (
                      <span className="text-base font-medium text-[#64748b]">{plan.usd}</span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-[#64748b] text-sm mb-5">{plan.desc}</p>
              <ul className="flex flex-col gap-2.5 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[#0f172a] text-sm">
                    <svg className="w-4 h-4 text-[#1E88E5] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-[#64748b] text-xs italic mb-5">
                Resultado: <span className="text-[#0f172a] not-italic font-medium">{plan.result}</span>
              </p>
              {plan.guarantee && (
                <div className="bg-[#F7F8FC] border border-[#e2e8f0] rounded-xl p-4 mb-5">
                  <p className="text-[#0f172a] text-xs leading-relaxed">
                    <strong>Garantia:</strong> {plan.guarantee}
                  </p>
                </div>
              )}
              {plan.note && (
                <p className="text-[#64748b] text-xs mb-5 border-l-2 border-[#F97316] pl-3 italic">
                  {plan.note}
                </p>
              )}
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-center font-bold py-3.5 rounded-full transition-colors text-sm ${plan.ctaStyle}`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-[#64748b] text-sm mt-8 italic">
          CV, LinkedIn e Gupy entram depois — alinhados à decisão que você tomou, não antes dela.
        </p>
      </div>
    </section>
  );
}
