const steps = [
  {
    n: "01",
    title: "Você preenche o formulário",
    desc: "5 perguntas sobre seu momento atual de carreira. Sem burocracia, sem formulário longo.",
  },
  {
    n: "02",
    title: "Entramos em contato",
    desc: "Avaliamos se faz sentido e qual formato é mais adequado para o seu momento.",
  },
  {
    n: "03",
    title: "Sessão de alinhamento",
    desc: "20 minutos para confirmar fit antes de qualquer compromisso. Sem pressão.",
  },
  {
    n: "04",
    title: "Começamos",
    desc: "Sessão agendada conforme sua disponibilidade. Processo estruturado do início ao fim.",
  },
];

export function Process() {
  return (
    <section className="bg-white px-4 py-20" aria-label="Como funciona na prática">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-3">
            Como funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] mb-4">
            Como funciona na prática
          </h2>
          <p className="text-[#64748b]">Um processo simples e sem atrito.</p>
        </div>
        <div className="flex flex-col gap-4">
          {steps.map(({ n, title, desc }) => (
            <div key={n} className="flex items-start gap-5 p-6 rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
              <span className="text-[#1E88E5] font-bold text-sm shrink-0 w-8">{n}</span>
              <div>
                <h3 className="font-bold text-[#0f172a] mb-1">{title}</h3>
                <p className="text-[#64748b] text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-[#64748b] text-sm mt-8 italic">
          &ldquo;Se não for o momento certo pra você, eu digo. Não vendo o que você não precisa.&rdquo;
        </p>
      </div>
    </section>
  );
}
