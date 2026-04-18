export interface Pergunta {
  id: string;
  texto: string;
  categoria: 'behavioral' | 'produto' | 'case' | 'lideranca';
  senioridade: Array<'jr' | 'pleno' | 'sr'>;
}

export const PERGUNTAS_ENTREVISTA: Pergunta[] = [
  { id: 'beh-01', texto: 'Conte sobre um conflito difícil com um colega. Como você resolveu?', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-02', texto: 'Descreva uma vez em que você falhou em algo importante. O que aprendeu?', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-03', texto: 'Fale de uma decisão sua que você mudaria hoje se pudesse.', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-04', texto: 'Conte sobre um feedback difícil que você recebeu.', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-05', texto: 'Descreva uma situação em que você teve que liderar sem autoridade formal.', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-06', texto: 'Fale sobre uma vez em que você discordou publicamente de sua liderança.', categoria: 'behavioral', senioridade: ['sr'] },
  { id: 'beh-07', texto: 'Conte sobre um projeto que teve que ser cancelado. Como você comunicou?', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-08', texto: 'Descreva uma vez em que você mudou de opinião com base em dados.', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-09', texto: 'Conte sobre seu maior erro profissional.', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-10', texto: 'Fale de uma conquista sua da qual você tem mais orgulho. Por quê?', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-11', texto: 'Como você lida com prazos impossíveis?', categoria: 'behavioral', senioridade: ['jr', 'pleno'] },
  { id: 'beh-12', texto: 'Descreva uma vez em que você teve que negociar com stakeholders difíceis.', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-13', texto: 'Conte sobre uma vez em que você estava claramente errado. Como reagiu?', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-14', texto: 'Fale de uma vez que você teve que tomar uma decisão sem dados suficientes.', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-15', texto: 'Descreva sua filosofia de trabalho em 3 frases.', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },

  { id: 'prod-01', texto: 'Qual produto você admira mais e por quê?', categoria: 'produto', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'prod-02', texto: 'Se você fosse o PM do WhatsApp, o que melhoraria nos próximos 3 meses?', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-03', texto: 'Como você priorizaria 10 features que o time propôs?', categoria: 'produto', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'prod-04', texto: 'Descreva uma métrica-Norte para um app de delivery. Justifique.', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-05', texto: 'Como você saberia se um novo feature "foi um sucesso"?', categoria: 'produto', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'prod-06', texto: 'Um experimento A/B deu resultado positivo mas o VP odeia a ideia. O que você faz?', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-07', texto: 'Descreva um produto que você "matou" e explique por quê.', categoria: 'produto', senioridade: ['sr'] },
  { id: 'prod-08', texto: 'Como você estruturaria descoberta para um mercado que ainda não existe?', categoria: 'produto', senioridade: ['sr'] },
  { id: 'prod-09', texto: 'Seu time entregou a feature; ninguém usa. Quais as hipóteses? Como testaria?', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-10', texto: 'Engenharia diz que a feature vai demorar 3x mais que o estimado. O que fazer?', categoria: 'produto', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'prod-11', texto: 'Qual a diferença entre uma métrica de output e uma métrica de outcome?', categoria: 'produto', senioridade: ['jr', 'pleno'] },
  { id: 'prod-12', texto: 'Como você decide entre otimizar um funil existente vs construir algo novo?', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-13', texto: 'Qual o papel de um PM em uma empresa com CEO engenheiro?', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-14', texto: 'Você tem que cortar 30% do roadmap. Como explica para o time?', categoria: 'produto', senioridade: ['sr'] },
  { id: 'prod-15', texto: 'Como PM você deveria escrever código? Justifique sua posição.', categoria: 'produto', senioridade: ['jr', 'pleno', 'sr'] },

  { id: 'case-01', texto: 'Quantas pizzas são vendidas no Brasil por ano? Estime.', categoria: 'case', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'case-02', texto: 'Desenhe um produto novo para estudantes universitários.', categoria: 'case', senioridade: ['jr', 'pleno'] },
  { id: 'case-03', texto: 'A retenção caiu 15% mês a mês. O que você investiga?', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-04', texto: 'Como você melhoraria a experiência de checkout de um e-commerce?', categoria: 'case', senioridade: ['jr', 'pleno'] },
  { id: 'case-05', texto: 'Proponha uma estratégia de crescimento para um app B2C nos próximos 12 meses.', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-06', texto: 'Conversões caíram 5% esta semana, mas só em iOS. Diagnóstico.', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-07', texto: 'Modele um produto para o mercado 50+.', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-08', texto: 'Desenhe a monetização de um app que hoje é gratuito.', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-09', texto: 'Como você estruturaria o go-to-market de uma feature B2B?', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-10', texto: 'Um concorrente lançou uma feature que seu produto não tem. Qual sua resposta?', categoria: 'case', senioridade: ['pleno', 'sr'] },

  { id: 'lid-01', texto: 'Como você dá feedback difícil para alguém sênior do time?', categoria: 'lideranca', senioridade: ['pleno', 'sr'] },
  { id: 'lid-02', texto: 'Um engenheiro do seu time está consistentemente abaixo da expectativa. O que fazer?', categoria: 'lideranca', senioridade: ['sr'] },
  { id: 'lid-03', texto: 'Como você constrói consenso sem diluir a decisão?', categoria: 'lideranca', senioridade: ['pleno', 'sr'] },
  { id: 'lid-04', texto: 'Descreva seu estilo de 1:1.', categoria: 'lideranca', senioridade: ['pleno', 'sr'] },
  { id: 'lid-05', texto: 'Como você contrata para um papel que nunca fez?', categoria: 'lideranca', senioridade: ['sr'] },
  { id: 'lid-06', texto: 'Seu time está desengajado. Qual seu primeiro passo?', categoria: 'lideranca', senioridade: ['pleno', 'sr'] },
  { id: 'lid-07', texto: 'Você discorda da direção que seu CPO está tomando. O que faz?', categoria: 'lideranca', senioridade: ['sr'] },
  { id: 'lid-08', texto: 'Como você calibra expectativas entre pessoas sêniores e júniores no mesmo time?', categoria: 'lideranca', senioridade: ['sr'] },
  { id: 'lid-09', texto: 'Um member do time quer ser promovido mas ainda não está pronto. Como comunica?', categoria: 'lideranca', senioridade: ['sr'] },
  { id: 'lid-10', texto: 'Você herdou um time em crise. Plano dos primeiros 30 dias?', categoria: 'lideranca', senioridade: ['sr'] },
];
