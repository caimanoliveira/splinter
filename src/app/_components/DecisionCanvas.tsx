const dimensions = [
  { n: "01", label: "Contexto da decisão", text: "O que está acontecendo e por que isso é difícil agora?" },
  { n: "02", label: "Critérios explícitos", text: "O que realmente importa para você nessa escolha?" },
  { n: "03", label: "Restrições reais", text: "O que não é negociável? Onde está o limite real?" },
  { n: "04", label: "Variáveis invisíveis", text: "O que você está ignorando por ser difícil de quantificar?" },
  { n: "05", label: "Padrões de valor", text: "Quais decisões passadas revelam o que você de fato prioriza?" },
  { n: "06", label: "Espaço de possibilidades", text: "Quais caminhos existem além dos óbvios?" },
  { n: "07", label: "Cenários e trade-offs", text: "O que você ganha e perde em cada caminho real?" },
];

export function DecisionCanvas() {
  return (
    <section id="metodo" className="bg-[#F7F8FC] px-4 py-20" aria-label="Decision Canvas — metodologia proprietária">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-3">
            Metodologia
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] mb-4">
            O Decision Canvas
          </h2>
          <p className="text-[#64748b] leading-relaxed max-w-xl mx-auto">
            Metodologia estruturada para decisões de carreira complexas. Desenvolvido a partir da
            experiência de tomada de decisão na Amazon e aplicado em dezenas de mentorias com
            profissionais de tech.{" "}
            <strong className="text-[#0f172a]">
              Não dá a resposta certa. Garante que você está fazendo as perguntas certas.
            </strong>
          </p>
        </div>
        <div className="bg-[#0f172a] rounded-2xl p-6 sm:p-8 border border-[#1e293b]">
          <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-6">
            7 dimensões
          </p>
          <div className="flex flex-col divide-y divide-[#1e293b]">
            {dimensions.map(({ n, label, text }) => (
              <div key={n} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                <span className="text-[#1E88E5] font-bold text-sm shrink-0 w-7 mt-0.5">{n}</span>
                <div>
                  <p className="text-white font-semibold text-sm mb-0.5">{label}</p>
                  <p className="text-[#64748b] text-sm">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
