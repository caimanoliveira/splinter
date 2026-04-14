const testimonials = [
  {
    quote: "A forma como ele estrutura o pensamento é impressionante. Saí da sessão com uma clareza que não tinha há meses.",
    author: "Product Designer em transição para PM",
    type: "mentoria" as const,
  },
  {
    quote: "Me preparou para entrevistas de um jeito muito diferente. Não decorei respostas, entendi a estratégia por trás de cada pergunta.",
    author: "Analista de CX → Product Manager",
    type: "mentoria" as const,
  },
  {
    quote: "Hypothesis-driven, data-informed. Foi a primeira vez que alguém me ajudou a pensar em carreira como se pensa em produto.",
    author: "Senior PM em Big Tech",
    type: "mentoria" as const,
  },
  {
    quote: "A didática e paciência são raras. Ele não dá resposta — te ensina a chegar nela.",
    author: "Tech Lead considerando transição",
    type: "mentoria" as const,
  },
  {
    quote: "Finalmente alguém que não me vendeu sonhos. Trade-offs reais, decisões reais. Sem vender sonhos.",
    author: "Gerente de Projetos em reposicionamento",
    type: "mentoria" as const,
  },
];

const tagLabels = {
  mentoria: { label: "Mentoria", color: "bg-blue-50 text-[#1E88E5] border-blue-100" },
  colega: { label: "Colega de trabalho", color: "bg-slate-50 text-[#475569] border-slate-200" },
};

export function Testimonials() {
  return (
    <section className="bg-[#F7F8FC] px-4 py-20" aria-label="Depoimentos de mentorados">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-3">
            Quem já viveu isso conta
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] mb-4">
            Depoimentos reais
          </h2>
          <p className="text-[#64748b]">De mentorados e colegas de trabalho</p>
        </div>
        <div className="flex flex-col gap-4">
          {testimonials.map(({ quote, author, type }) => (
            <article
              key={author}
              className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm"
              itemScope
              itemType="https://schema.org/Review"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tagLabels[type].color}`}>
                  {tagLabels[type].label}
                </span>
              </div>
              <p className="text-[#0f172a] leading-relaxed mb-4 text-base" itemProp="reviewBody">
                &ldquo;{quote}&rdquo;
              </p>
              <p className="text-[#64748b] text-sm font-medium" itemProp="author">
                — {author}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
