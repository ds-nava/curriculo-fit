// Dados mock para testes locais - sem chamar a API
export const mockAnalysisResponse = {
  cv_otimizado: `# João da Silva
## Desenvolvedor Full Stack Senior

**E-mail:** joao@email.com | **Telefone:** (11) 99999-9999 | **LinkedIn:** linkedin.com/in/joao

---

## RESUMO PROFISSIONAL
Desenvolvedor Full Stack com 6+ anos de experiência em desenvolvimento de aplicações web escaláveis. Especialista em React, Node.js e arquitetura de microserviços. Líder técnico com histórico comprovado em otimização de performance e mentoria de equipes.

---

## EXPERIÊNCIA PROFISSIONAL

### Senior Full Stack Developer | TechCorp (2022 - Presente)
- Liderou migração de monolito para microserviços, reduzindo tempo de deploy em 70%
- Implementou arquitetura com Docker e Kubernetes, suportando 100k+ requisições/dia
- Mentorizou 3 desenvolvedores juniores em React e Node.js
- Otimizou APIs REST reduzindo latência em 40% através de caching estratégico

### Full Stack Developer | StartupXYZ (2020 - 2022)
- Desenvolveu aplicações React com 95+ Lighthouse score
- Criou APIs REST robustas com Node.js e Express
- Implementou CI/CD com GitHub Actions, reduzindo bugs em produção em 60%
- Trabalhou com banco de dados SQL e NoSQL (PostgreSQL, MongoDB)

### Junior Developer | WebAgency (2018 - 2020)
- Desenvolveu componentes React reutilizáveis
- Participou em projetos com Agile/Scrum
- Aprendizado em boas práticas de clean code

---

## SKILLS TÉCNICOS

**Frontend:** React, Redux, TypeScript, Tailwind CSS, Jest, Cypress
**Backend:** Node.js, Express, Python, Django, GraphQL
**Databases:** PostgreSQL, MongoDB, Redis
**DevOps:** Docker, Kubernetes, GitHub Actions, AWS (EC2, S3, RDS)
**Ferramentas:** Git, VS Code, Jira, Figma

---

## PROJETOS RELEVANTES

### Dashboard Analítico em Tempo Real
- Desenvolvido em React + Node.js processando 50k eventos/min
- Implementação de WebSockets para atualizações em tempo real
- Redução de consumo de dados em 35% com compressão gzip

### Plataforma de E-commerce
- Arquitetura de microserviços com 15+ APIs independentes
- Implementação de sistema de pagamento seguro
- Performance otimizada para 5k CCP

---

## EDUCAÇÃO
**Bacharel em Ciência da Computação** - Universidade XYZ (2018)

---

## CERTIFICAÇÕES
- AWS Solutions Architect Associate (2023)
- Docker Certified Associate (2022)`,

  analise: {
    score_compatibilidade: 85,
    resumo: "Currículo muito bem alinhado com a vaga. O candidato possui todas as competências técnicas necessárias (React, Node.js, Docker, Kubernetes) e demonstra experiência sólida em liderança e otimização de performance. Structure é clara e profissional.",
    subscores: {
      aderencia_tecnica: 38,
      aderencia_responsabilidades: 23,
      aderencia_dominio: 19,
      clareza_comunicacao: 14
    },
    pontos_fortes: [
      "Experiência comprovada com React e Node.js (stack da vaga)",
      "Histórico demonstrado em arquitetura de microserviços e Docker/Kubernetes",
      "Demonstra liderança técnica e mentoria de equipes",
      "Menção a otimização de performance (redução de latência, Lighthouse)",
      "Estrutura clara e fácil leitura do currículo"
    ],
    gaps_criticos: [
      "Sem menção explícita a AWS (vaga requer experiência)",
      "Falta detalhe sobre GraphQL em produção (requisito da vaga)"
    ],
    keywords_presentes: [
      "React", "Node.js", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "REST APIs", "JavaScript", "Microserviços", "Git", "Agile"
    ],
    keywords_ausentes: [
      "AWS", "GraphQL", "Redis", "Performance tuning", "CI/CD pipelines"
    ],
    recomendacoes: [
      "Expanda a seção de DevOps mencionando especificamente: 'Configuração de pipelines CI/CD com GitHub Actions, Jenkins e GitLab CI'",
      "Adicione uma linha na experiência atual: 'Implementação de APIs GraphQL com Apollo Server para queries otimizadas'",
      "Na seção skills, mude de 'GraphQL' para 'GraphQL (12+ meses em produção)', e adicione 'AWS (EC2, Lambda, RDS)'",
      "Inclua métrica de impacto na seção de E-commerce: 'Aumento de conversão em 25% através de otimização de bundle size (de 2.8MB para 820KB)'"
    ],
    diagnostico_estrutural: {
      estrutura_atual_adequada: true,
      motivo_estrutural: "Sequência lógica excelente: Resumo → Experiência → Projetos → Skills → Educação. Fluxo narrativo claro da evolução profissional.",
      secoes_a_reordenar: [],
      secoes_a_comprimir: [],
      secoes_a_expandir: [
        "Projetos Relevantes (adicione 1-2 linhas de impacto mensurável em cada)"
      ],
      novo_outline_sugerido: [
        "Cabeçalho com dados de contato",
        "Resumo Profissional",
        "Skills Técnicos (já bem posicionado)",
        "Experiência Profissional",
        "Projetos Relevantes (com métricas)",
        "Educação e Certificações"
      ]
    },
    cobertura_requisitos: [
      {
        requisito: "6+ anos de experiência com React",
        status: "atende_total",
        evidencia_curriculo: "Senior Full Stack Developer com 6 anos, menção explícita a React em múltiplos contextos",
        confianca: "alta"
      },
      {
        requisito: "Experiência com Node.js e arquitetura de APIs",
        status: "atende_total",
        evidencia_curriculo: "APIs REST Node.js, GraphQL mencionado, múltiplos projetos em backends",
        confianca: "alta"
      },
      {
        requisito: "Conhecimento de Docker e Kubernetes",
        status: "atende_total",
        evidencia_curriculo: "Implementou arquitetura com Docker e Kubernetes, reduziu deployment time em 70%",
        confianca: "alta"
      },
      {
        requisito: "Liderança técnica",
        status: "atende_total",
        evidencia_curriculo: "Mentorizou 3 desenvolvedores juniores, liderou migração de arquitetura",
        confianca: "media"
      },
      {
        requisito: "Experiência com bancos de dados SQL e NoSQL",
        status: "atende_total",
        evidencia_curriculo: "PostgreSQL, MongoDB, Redis mencionados",
        confianca: "media"
      }
    ]
  }
};
