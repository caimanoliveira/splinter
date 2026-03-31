const situations = [
  {
    title: "Sua carreira travou.",
    desc: "Você entrega resultado, mas promoções passam na sua frente e você não entende o que está faltando.",
  },
  {
    title: "Você quer mudar de empresa.",
    desc: "Tem boas opções mas não consegue decidir. Fica voltando para a mesma questão sem chegar a lugar nenhum.",
  },
  {
    title: "Está em transição de área.",
    desc: "Quer ir para produto, ou sair de produto, e não sabe como contar sua história para o mercado.",
  },
  {
    title: "Precisa se posicionar melhor.",
    desc: "Sabe que precisa aparecer mais, mas não sabe o que postar nem como otimizar o LinkedIn.",
  },
  {
    title: "Tem uma entrevista importante.",
    desc: "Quer chegar preparado, com cases sólidos e narrativa clara.",
  },
  {
    title: "Está avaliando o mercado internacional.",
    desc: "Tem interesse em oportunidades fora do Brasil e não sabe por onde começar.",
  },
];

export function ForWho() {
  return (
    <section id="para-voce" className="bg-[#F7F8FC] px-4 py-20" aria-label="Para quem é esta mentoria">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-3">
            Para quem é
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] mb-4">
            Isso foi feito pra você se…
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {situations.map(({ title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm hover:border-[#1E88E5]/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#1E88E5] mt-2 shrink-0" />
                <div>
                  <p className="font-bold text-[#0f172a] mb-1">{title}</p>
                  <p className="text-[#64748b] text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
