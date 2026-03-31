const WA_LINK = "https://wa.me/5511940347276";

const plans = [
  {
    type: "Sessão Única",
    name: "Decisão",
    price: "R$ 600",
    usd: "/ USD 150",
    desc: "Para um momento de virada específico que precisa de clareza agora.",
    features: [
      "1 sessão de 90 minutos, ao vivo",
      "Aplicação do Decision Canvas",
      "Mapeamento de variáveis invisíveis",
      "Entregável concreto ao final da sessão",
    ],
    result: "Clareza sobre a decisão + próximo passo concreto.",
    cta: "Agendar sessão",
    recommended: false,
    note: "Não tem certeza se o Ciclo Travessia é para você? Comece aqui.",
  },
  {
    type: "Ciclo 1:1",
    name: "Travessia",
    price: "R$ 2.000",
    usd: null,
    desc: "Para profissionais em transição ou com múltiplas decisões conectadas que precisam de acompanhamento.",
    features: [
      "4 sessões estruturadas de 60 minutos",
      "4 a 6 semanas de duração",
      "Decision Canvas completo",
      "Construção de narrativa de carreira",
      "Posicionamento LinkedIn + preparação para entrevistas",
      "Suporte assíncrono leve entre sessões",
    ],
    result: "Plano de ação completo + critérios claros para decidir.",
    cta: "Quero conhecer o Ciclo",
    recommended: true,
    note: null,
  },
  {
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
    recommended: false,
    note: null,
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
                  <p className="text-[#64748b] text-xs font-semibold tracking-widest uppercase mb-1">
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
                Resultado: <span className="text-[#0f172a]">{plan.result}</span>
              </p>
              {plan.note && (
                <p className="text-[#64748b] text-xs mb-4 border-l-2 border-[#e2e8f0] pl-3">
                  {plan.note}
                </p>
              )}
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-center font-bold py-3.5 rounded-full transition-colors text-sm ${
                  plan.recommended
                    ? "bg-[#1E88E5] hover:bg-[#1565C0] text-white"
                    : "bg-[#0f172a] hover:bg-[#1e293b] text-white"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
