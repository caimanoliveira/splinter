const forYou = [
  "Está entre caminhos e fica voltando para a mesma questão sem resolver",
  "Quer decidir com método — não no impulso, não no medo",
  "Está disposto(a) a executar o que decidir",
  "Profissional de tech (produto, design, engenharia, dados) com 5+ anos de experiência",
  "Quer aprender um framework que pode reutilizar em futuras decisões",
  "Entende que CV, LinkedIn e Gupy vêm depois — não antes — da decisão",
];

const notForYou = [
  "Quer que eu decida por você — eu não decido",
  "Busca motivação ou validação constante para se sentir seguro(a)",
  "Não pretende executar o que decidir",
  "Procura suporte emocional prolongado ou terapia",
  "Quer uma fórmula pronta: \"me diz o que fazer\"",
];

export function Qualification() {
  return (
    <section className="bg-white px-4 py-20" aria-label="Para quem é e para quem não é">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] mb-3">
            Isso é para você — ou não é.{" "}
            <span className="text-[#64748b] font-bold">Seja honesto.</span>
          </h2>
          <p className="text-[#64748b]">Transparência desde o início. Trade-offs explícitos.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* É para você */}
          <div className="bg-[#F7F8FC] rounded-2xl p-6 border border-[#e2e8f0]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#1E88E5]/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#1E88E5]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0f172a]">É para você se…</h3>
            </div>
            <ul className="flex flex-col gap-3">
              {forYou.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-[#0f172a]">
                  <svg className="w-4 h-4 text-[#1E88E5] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Não é para você */}
          <div className="bg-[#F7F8FC] rounded-2xl p-6 border border-red-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0f172a]">Não é para você se…</h3>
            </div>
            <ul className="flex flex-col gap-3">
              {notForYou.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-[#0f172a]">
                  <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
