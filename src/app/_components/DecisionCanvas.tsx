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
            Decision Canvas: coloque sua carreira no papel
          </h2>
          <p className="text-[#64748b] leading-relaxed max-w-xl mx-auto">
            Tirar a decisão da sua cabeça e colocar em um modelo visual — com critérios, trade-offs
            e cenários — é o que transforma indecisão em clareza.
          </p>
        </div>

        {/* Visual grid canvas */}
        <div className="bg-[#0f172a] rounded-2xl p-6 sm:p-8 border border-[#1e293b]">
          <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-6">
            7 dimensões · Decision Canvas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#1e293b] rounded-xl overflow-hidden">
            {dimensions.map(({ n, label, text }, i) => (
              <div
                key={n}
                className={`bg-[#0f172a] p-5 flex items-start gap-4 ${
                  i === dimensions.length - 1 && dimensions.length % 2 !== 0
                    ? "sm:col-span-2"
                    : ""
                }`}
              >
                <span className="text-[#F97316] font-extrabold text-2xl leading-none shrink-0 w-10">
                  {n}
                </span>
                <div>
                  <p className="text-white font-bold text-sm mb-1">{label}</p>
                  <p className="text-[#64748b] text-sm leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Closing statement */}
          <div className="mt-6 pt-6 border-t border-[#1e293b] text-center">
            <p className="text-[#94a3b8] text-base">
              O Canvas não dá a resposta certa.{" "}
              <strong className="text-white">
                Garante que você está fazendo as perguntas certas.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
