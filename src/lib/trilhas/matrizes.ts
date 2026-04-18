export interface Matriz {
  slug: 'pm-ladder' | 'lideranca';
  titulo: string;
  niveis: Array<{ id: number; nome: string }>;
  competencias: Array<{
    id: string;
    nome: string;
    descricao: string;
    descritores: Record<number, string>;
  }>;
}

const pmLadder: Matriz = {
  slug: 'pm-ladder',
  titulo: 'PM Career Ladder',
  niveis: [
    { id: 1, nome: 'APM' },
    { id: 2, nome: 'PM' },
    { id: 3, nome: 'Sr PM' },
    { id: 4, nome: 'Staff PM' },
  ],
  competencias: [
    {
      id: 'discovery',
      nome: 'Discovery',
      descricao: 'Pesquisa, entrevistas e geração de insights de produto',
      descritores: {
        1: 'Participa de entrevistas conduzidas por outros; resume achados.',
        2: 'Conduz entrevistas de descoberta com apoio; formula hipóteses simples.',
        3: 'Estrutura agendas de discovery independente; triangula sinais qualitativos e quantitativos.',
        4: 'Define frameworks de discovery para o time; mentora PMs na técnica.',
      },
    },
    {
      id: 'delivery',
      nome: 'Delivery',
      descricao: 'Planejamento, priorização e entrega contínua',
      descritores: {
        1: 'Escreve histórias claras; acompanha execução de uma iniciativa.',
        2: 'Conduz ritos do time; mantém backlog priorizado; desbloqueia entregas.',
        3: 'Planeja roadmap trimestral com trade-offs; reduz risco de entrega com marcos intermediários.',
        4: 'Define padrões de delivery cross-time; eleva qualidade e previsibilidade do portfólio.',
      },
    },
    {
      id: 'estrategia',
      nome: 'Estratégia',
      descricao: 'Visão de produto e alinhamento com estratégia da empresa',
      descritores: {
        1: 'Entende a estratégia do time e conecta suas entregas.',
        2: 'Formula objetivos trimestrais alinhados à estratégia da área.',
        3: 'Propõe apostas estratégicas com evidência; influencia o plano da área.',
        4: 'Define a estratégia da área em conjunto com liderança; justifica com narrativa e dados.',
      },
    },
    {
      id: 'stakeholders',
      nome: 'Stakeholder management',
      descricao: 'Alinhamento com áreas adjacentes e executivos',
      descritores: {
        1: 'Comunica progresso para stakeholders diretos.',
        2: 'Negocia escopo e prazos com áreas adjacentes.',
        3: 'Influencia executivos de outras áreas com dados e narrativa.',
        4: 'Resolve conflitos estratégicos inter-áreas; ganha patrocínio executivo.',
      },
    },
    {
      id: 'metricas',
      nome: 'Métricas & análise',
      descricao: 'Definição de métricas, leitura de dados, experimentação',
      descritores: {
        1: 'Lê dashboards; interpreta métricas chave do produto.',
        2: 'Define métricas para iniciativas; analisa resultados de experimentos.',
        3: 'Propõe árvores de métricas completas; instrumenta experimentos sofisticados.',
        4: 'Estabelece framework de medição da área; mentora o time em análise causal.',
      },
    },
    {
      id: 'comunicacao',
      nome: 'Comunicação',
      descricao: 'Narrativa, escrita e apresentação',
      descritores: {
        1: 'Escreve docs claros do dia a dia (histórias, updates).',
        2: 'Escreve PRFAQs, one-pagers e apresentações estruturadas.',
        3: 'Conduz narrativas de médio/longo prazo para o time e stakeholders.',
        4: 'Comunica com executivos e externamente; eleva padrão de escrita do time.',
      },
    },
    {
      id: 'lideranca',
      nome: 'Liderança de produto',
      descricao: 'Condução do time e formação de cultura',
      descritores: {
        1: 'Colabora bem; traz problemas em vez de soluções apenas.',
        2: 'Facilita discussões técnicas e de produto dentro do time.',
        3: 'Mentora PMs juniors; lidera iniciativas multidisciplinares.',
        4: 'Desenvolve líderes; eleva a maturidade do craft de produto no time.',
      },
    },
  ],
};

const lideranca: Matriz = {
  slug: 'lideranca',
  titulo: 'Liderança',
  niveis: [
    { id: 1, nome: 'IC' },
    { id: 2, nome: 'Líder de time' },
    { id: 3, nome: 'Gestor' },
    { id: 4, nome: 'Diretor' },
  ],
  competencias: [
    {
      id: 'visao',
      nome: 'Visão & direção',
      descricao: 'Definir e comunicar para onde o time vai',
      descritores: {
        1: 'Entende e executa a direção dada por outros.',
        2: 'Traduz direção em prioridades claras para o time imediato.',
        3: 'Define direção de médio prazo com o time; ajusta conforme aprendizado.',
        4: 'Define direção de longo prazo; alinha múltiplos times em torno dela.',
      },
    },
    {
      id: 'coaching',
      nome: 'Coaching',
      descricao: 'Desenvolvimento de pessoas através de conversas regulares',
      descritores: {
        1: 'Dá feedback pontual quando solicitado.',
        2: 'Mantém 1:1s consistentes; ajuda pessoas a resolver problemas táticos.',
        3: 'Orienta crescimento de carreira; desbloqueia pessoas via perguntas certas.',
        4: 'Desenvolve líderes que desenvolvem outros.',
      },
    },
    {
      id: 'decisao',
      nome: 'Decisão sob incerteza',
      descricao: 'Escolher com informação incompleta e reversibilidade em mente',
      descritores: {
        1: 'Escolhe bem dentro de opções dadas.',
        2: 'Avalia trade-offs visíveis e decide em prazos curtos.',
        3: 'Distingue decisões reversíveis de irreversíveis; protege o time da pressão.',
        4: 'Estabelece rituais de decisão; eleva qualidade das decisões cross-time.',
      },
    },
    {
      id: 'performance',
      nome: 'Gestão de performance',
      descricao: 'Expectativas claras, feedback contínuo e avaliação justa',
      descritores: {
        1: 'Dá feedback informal no dia a dia.',
        2: 'Conduz conversas de feedback estruturadas; reconhece alto desempenho.',
        3: 'Gerencia baixo desempenho com clareza e empatia; promove quem merece.',
        4: 'Calibra performance no nível da organização; eleva barra do time.',
      },
    },
    {
      id: 'executivo',
      nome: 'Comunicação executiva',
      descricao: 'Comunicar com C-level e board',
      descritores: {
        1: 'Apresenta updates operacionais com apoio.',
        2: 'Prepara narrativas para stakeholders seniores com coaching.',
        3: 'Comunica diretamente com executivos; antecipa perguntas difíceis.',
        4: 'Influencia decisão no C-level/board.',
      },
    },
    {
      id: 'time',
      nome: 'Construção de time',
      descricao: 'Contratar, integrar e formar times',
      descritores: {
        1: 'Participa de entrevistas como referência técnica.',
        2: 'Conduz entrevistas completas; define critérios para um papel.',
        3: 'Estrutura pipeline de contratação; integra novos times.',
        4: 'Define modelo organizacional; patrocina diversidade e inclusão.',
      },
    },
    {
      id: 'accountability',
      nome: 'Accountability',
      descricao: 'Assumir resultados e aprender com falhas',
      descritores: {
        1: 'Reconhece erros individuais.',
        2: 'Assume responsabilidade por entregas do time.',
        3: 'Conduz post-mortems construtivos; reduz recorrência.',
        4: 'Cultiva cultura de ownership em toda a organização.',
      },
    },
  ],
};

export const matrizes: Record<string, Matriz> = {
  'pm-ladder': pmLadder,
  lideranca,
};

export function getMatriz(slug: 'pm-ladder' | 'lideranca'): Matriz {
  return matrizes[slug];
}
