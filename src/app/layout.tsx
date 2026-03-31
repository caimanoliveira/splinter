import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://mentoria.caimanoliveira.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mentoria de Carreira & Decisão | Caiman Oliveira — Senior PM Amazon",
    template: "%s | Mentoria de Carreira & Decisão",
  },
  description:
    "Mentoria de carreira para PMs, designers, engenheiros e analistas sêniors em tech. Decision Canvas — metodologia estruturada para decisões complexas de carreira. Senior PM na Amazon • Formado pela USP • +50 profissionais mentorados. Primeira sessão gratuita.",
  keywords: [
    "mentoria de carreira",
    "mentoria para product manager",
    "transição de carreira tech",
    "Decision Canvas",
    "decisão de carreira",
    "mentoria PM",
    "mentoria product manager",
    "carreira em produto",
    "posicionamento LinkedIn",
    "preparação entrevista tech",
    "mentoria sênior tech",
    "Caiman Oliveira",
    "Amazon senior PM",
    "mentoria online Brasil",
  ],
  authors: [{ name: "Caiman Oliveira", url: SITE_URL }],
  creator: "Caiman Oliveira",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Mentoria de Carreira & Decisão — Caiman Oliveira",
    title: "Profissionais sêniors em tech não travam por falta de competência. Travam por falta de clareza.",
    description:
      "Senior PM na Amazon. Metodologia Decision Canvas para decisões de carreira. Mentoria para PMs, designers, engenheiros e analistas em tech. +50 profissionais mentorados. Primeira sessão gratuita.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentoria de Carreira & Decisão | Caiman Oliveira",
    description:
      "Decisões de carreira com clareza. Decision Canvas + Senior PM Amazon. Primeira sessão gratuita.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#mentor`,
      name: "Caiman Oliveira",
      jobTitle: "Senior Product Manager",
      worksFor: { "@type": "Organization", name: "Amazon" },
      alumniOf: { "@type": "Organization", name: "Universidade de São Paulo (USP)" },
      description:
        "Senior Product Manager na Amazon. Formado em Administração pela USP. Mentor de carreira especializado no método Decision Canvas para profissionais sêniors de tech em momentos de decisão estratégica.",
      knowsAbout: [
        "Product Management",
        "Career Mentorship",
        "Decision Making",
        "Career Transition",
        "LinkedIn Positioning",
        "Interview Preparation",
        "Growth",
        "UX/CX",
      ],
      email: "mentoriacarreiraedecisao@gmail.com",
      url: SITE_URL,
      sameAs: [
        "https://linkedin.com/in/caimanoliveira",
        "https://instagram.com/caimanoliveira",
      ],
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service`,
      name: "Mentoria de Carreira & Decisão",
      provider: { "@id": `${SITE_URL}/#mentor` },
      description:
        "Mentoria individual e em grupo para profissionais sêniors de tech (produto, design, engenharia, dados) em momentos de decisão estratégica de carreira. Usando o Decision Canvas — metodologia proprietária de 7 dimensões para estruturar decisões complexas.",
      serviceType: "Career Mentoring",
      areaServed: [
        { "@type": "Country", name: "Brazil" },
        { "@type": "AdministrativeArea", name: "International" },
      ],
      inLanguage: "pt-BR",
      offers: [
        {
          "@type": "Offer",
          name: "Sessão Única — Decisão",
          price: "600",
          priceCurrency: "BRL",
          description: "1 sessão de 90 minutos com foco em 1 decisão real usando o Decision Canvas. Entregável concreto ao final.",
        },
        {
          "@type": "Offer",
          name: "Ciclo 1:1 — Travessia",
          price: "2000",
          priceCurrency: "BRL",
          description: "4 sessões estruturadas de 60 minutos em 4 a 6 semanas. Inclui Decision Canvas completo, narrativa de carreira, posicionamento LinkedIn, preparação para entrevistas.",
        },
        {
          "@type": "Offer",
          name: "Mentoria em Grupo — Decisões em Contexto",
          price: "450",
          priceCurrency: "BRL",
          description: "Grupo de 6 a 10 pessoas, 2 encontros por mês de 90 min. Decisões reais em contexto coletivo.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "O que é o Decision Canvas?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "O Decision Canvas é uma metodologia proprietária de 7 dimensões desenvolvida por Caiman Oliveira para estruturar decisões complexas de carreira: contexto da decisão, critérios explícitos, restrições reais, variáveis invisíveis, padrões de valor, espaço de possibilidades e cenários/trade-offs. Não dá a resposta certa — garante que você está fazendo as perguntas certas.",
          },
        },
        {
          "@type": "Question",
          name: "Para quem é a mentoria de carreira com Caiman Oliveira?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Para profissionais sêniors de tech — PMs, designers, engenheiros, analistas — em momentos de decisão estratégica: transição de área, mudança de empresa, preparação para entrevistas, posicionamento no LinkedIn, avaliação de proposta ou reposicionamento de carreira.",
          },
        },
        {
          "@type": "Question",
          name: "Qual a diferença entre Sessão Decisão e Ciclo Travessia?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A Sessão Decisão (R$600) é focada em uma decisão específica — 90 minutos com entregável concreto. O Ciclo Travessia (R$2.000) é um acompanhamento de 4 sessões para quem está em transição ou tem múltiplas decisões conectadas.",
          },
        },
        {
          "@type": "Question",
          name: "Como funciona a sessão de diagnóstico gratuita?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "É uma sessão de alinhamento de 20 minutos, sem compromisso. Você apresenta seu momento atual e identificamos juntos se a mentoria faz sentido e qual formato é mais adequado. Caiman responde todos os formulários — sem automação.",
          },
        },
        {
          "@type": "Question",
          name: "A mentoria atende profissionais fora do Brasil?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sim. As sessões são online e há opção de pagamento em USD (Sessão Decisão: USD 150). Atendimento em português.",
          },
        },
        {
          "@type": "Question",
          name: "Por que profissionais qualificados travam nas decisões de carreira?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Porque focam nas variáveis visíveis (salário, título, nome da empresa) e ignoram as variáveis que realmente determinam satisfação: aprendizado nos próximos 2 anos, qualidade do gestor, cultura de decisão da empresa e custo emocional da escolha. O Decision Canvas estrutura exatamente essas variáveis invisíveis.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
