"use client";
import { useState } from "react";

const faqs = [
  {
    q: "Qual a diferença entre Sessão Decisão e Ciclo Travessia?",
    a: "A Sessão Decisão é focada em uma decisão específica — você sai com clareza sobre aquela questão. O Ciclo Travessia é um acompanhamento de 4 sessões, indicado para quem está em transição ou tem múltiplas decisões conectadas. Muitos começam pela Sessão e entendem, ao vivo, o que é possível em mais profundidade.",
  },
  {
    q: "Funciona para quem não é PM?",
    a: "Sim. A mentoria é para qualquer profissional sênior de tech — produto, design, engenharia, dados, UX/CX. O que importa é que você está em um momento de decisão estratégica de carreira, não o cargo específico.",
  },
  {
    q: "As sessões são online ou presenciais?",
    a: "Online, via Google Meet ou Zoom. Isso permite agenda flexível e atendimento a profissionais em qualquer cidade do Brasil ou fora do país.",
  },
  {
    q: "Posso parcelar?",
    a: "Sim. Há opções de parcelamento. Entre em contato via WhatsApp para verificar as condições disponíveis.",
  },
  {
    q: "Como sei se estou no momento certo para uma mentoria?",
    a: "Se você está diante de uma decisão de carreira que volta sempre — sobre mudar de empresa, aceitar uma proposta, transicionar de área — e não consegue avançar com clareza, provavelmente está no momento certo. A sessão de alinhamento inicial (gratuita, 20 min) existe justamente para isso.",
  },
  {
    q: "O que eu recebo ao final de cada sessão?",
    a: "Depende do tipo de sessão. Na Sessão Decisão, você sai com a decisão mais clara e um próximo passo concreto. No Ciclo Travessia, o entregável vai evoluindo — inclui Decision Canvas completo, narrativa de carreira, posicionamento LinkedIn e plano de ação.",
  },
  {
    q: "Você atende profissionais fora do Brasil?",
    a: "Sim. Atendo em português e as sessões são remotas. A Sessão Decisão também tem opção em USD 150.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-[#F7F8FC] px-4 py-20" aria-label="Perguntas frequentes">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a]">
            Perguntas frequentes
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <button
                className="w-full flex items-start justify-between gap-4 p-6 text-left"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="font-semibold text-[#0f172a] text-sm sm:text-base leading-snug">{q}</span>
                <span className="text-[#1E88E5] text-lg shrink-0 mt-0.5">
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-6">
                  <p className="text-[#64748b] text-sm leading-relaxed">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
