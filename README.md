# CurriculoFit

Aplicação fullstack para otimização de currículo com foco em aderência a uma vaga específica.

O projeto recebe:
- currículo em PDF, Markdown ou TXT;
- descrição da vaga como URL ou texto.

E retorna:
- currículo otimizado em Markdown;
- análise de compatibilidade com score, gaps e recomendações.

## Motivação

Este projeto foi desenhado para estudo prático de Java 21 e Spring Boot 3 com IA aplicada, em um cenário real de transição de carreira para desenvolvimento.

## Stack

- Backend: Java 21, Spring Boot 3.2.x, Spring AI (OpenAI-compatible via Groq), PDFBox
- Frontend: React 18, Vite, react-markdown, recharts
- Build: Maven
- Containers: Docker + Docker Compose
- Testes: JUnit 5 + Mockito + MockMvc

## Fluxo da Aplicação

```text
[Frontend React]
      |
      | multipart/form-data (cvFile + jobSource)
      v
[OptimizerController]
      |
      +--> [CvParserService] ----> texto do currículo
      |
      +--> [JobFetcherService] --> texto da vaga (ou r.jina.ai)
      |
      v
[OptimizerService] --prompt--> [Groq/OpenAI-compatible via Spring AI]
      |
      v
  JSON parse (OptimizeResponse)
      |
      v
[Frontend: CVPreview + FitAnalysis]
```

## Pré-requisitos

- Java 21
- Maven 3.9+
- Node.js 20+
- Docker e Docker Compose (opcional)

## Variáveis de Ambiente

Use o arquivo `.env.example` como referência.

Variáveis principais:

- `GROQ_API_KEY`: chave da API do Groq (obrigatória para IA real)
- `CORS_ALLOWED_ORIGINS`: origens permitidas no backend, separadas por vírgula
- `VITE_API_BASE_URL`: URL base da API usada pelo frontend
- `RATE_LIMIT_ENABLED`: habilita/desabilita rate limiting no endpoint de otimização
- `RATE_LIMIT_REQUESTS_PER_MINUTE`: limite de requisições por IP/minuto
- `JOB_FETCHER_TIMEOUT_SECONDS`: timeout de busca de vaga por URL
- `JOB_FETCHER_RETRY_MAX_ATTEMPTS`: tentativas totais para busca externa
- `JOB_FETCHER_RETRY_BACKOFF_MS`: backoff inicial (ms) entre tentativas

### BYOK (Bring Your Own Key)

O frontend permite o usuário validar e usar a própria chave Groq durante a sessão.

- A chave do usuário é mantida apenas em memória da aba.
- Não é persistida em banco, arquivo, cookie ou storage.
- Ao recarregar/fechar a aba, a chave é descartada.
- Sem chave do usuário, o backend usa o fallback `GROQ_API_KEY`.

Exemplo no PowerShell:

```powershell
$env:GROQ_API_KEY="sua-chave-aqui"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost"
$env:VITE_API_BASE_URL="http://localhost:8080"
```

## Inicio Rapido (Local sem Docker)

1. Suba o backend:

```powershell
cd backend
mvn spring-boot:run
```

2. Em outro terminal, suba o frontend:

```powershell
cd frontend
npm install
npm run dev
```

3. Acesse:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## Inicio Rapido (Docker)

Na raiz do projeto:

```powershell
$env:GROQ_API_KEY="sua-chave-aqui"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost"
docker compose up --build
```

Acessos:

- Frontend: `http://localhost`
- Backend: `http://localhost:8080`

Para rodar em background:

```powershell
docker compose up -d --build
```

Para derrubar:

```powershell
docker compose down
```

## Modo Mock x Modo IA Real (Frontend)

Por padrao, o frontend pode operar com dados mock para facilitar testes de interface.

Arquivo de controle:

- `frontend/src/testConfig.js`

Chave:

- `USE_MOCK_DATA = true`: usa dados fake (sem chamada ao backend/IA)
- `USE_MOCK_DATA = false`: chama a API real (`POST /api/optimize`)

Observacao: para validar integracao ponta a ponta, defina `USE_MOCK_DATA = false`.

## API

### POST `/api/optimize`

- Content-Type: `multipart/form-data`
- Campos:
  - `cvFile`: arquivo PDF, MD ou TXT
  - `jobSource`: URL ou texto da vaga (minimo de 20 caracteres)
- Header opcional:
  - `X-Groq-Api-Key`: chave Groq do usuário para sobrescrever a chave padrão do servidor nesta requisição

### POST `/api/keys/groq/validate`

- Header obrigatório:
  - `X-Groq-Api-Key`: chave Groq a ser validada
- Resposta:
  - `200` quando válida
  - `400/429` quando inválida ou indisponível

Resposta de sucesso (exemplo):

```json
{
  "cv_otimizado": "# Nome\n...",
  "analise": {
    "score_compatibilidade": 78,
    "resumo": "Boa aderencia geral...",
    "pontos_fortes": ["Java", "Spring Boot"],
    "gaps_criticos": ["AWS"],
    "keywords_presentes": ["REST", "SQL"],
    "keywords_ausentes": ["Kubernetes"],
    "recomendacoes": ["Criar projeto deployavel com Docker"],
    "diagnostico_estrutural": {
      "estrutura_atual_adequada": true,
      "motivo_estrutural": "Resumo do diagnostico estrutural",
      "secoes_a_reordenar": ["Experiencia", "Projetos"],
      "secoes_a_comprimir": ["Resumo"],
      "secoes_a_expandir": ["Projetos"],
      "novo_outline_sugerido": ["Resumo", "Experiencia", "Projetos", "Educacao"]
    },
    "cobertura_requisitos": [
      {
        "requisito": "Spring Boot",
        "status": "ATENDE",
        "evidencia_curriculo": "Projeto X com API REST",
        "confianca": "ALTA"
      }
    ],
    "subscores": {
      "aderencia_tecnica": 80,
      "aderencia_responsabilidades": 75,
      "aderencia_dominio": 70,
      "clareza_comunicacao": 82
    }
  }
}
```

## Healthcheck

Endpoint util para verificar disponibilidade do backend:

- `GET /actuator/health/readiness`

## Testes

Backend:

```powershell
cd backend
mvn test
```

## Decisoes Tecnicas

- Spring AI: simplifica integracao com provedores LLM via abstrações de chat e prompts.
- Groq com endpoint OpenAI-compatible: integracao simples com Spring AI e boa opcao para testes.
- Configuracao Spring AI: o bean de ChatClient fica em backend/src/main/java/com/curriculofit/ai/OpenAiConfig.java.
- PDFBox: biblioteca madura e estavel para extracao de texto de PDF.
- r.jina.ai: ajuda na extracao de texto limpo de URLs de vaga.
- React + Vite: setup rapido para desenvolvimento iterativo do frontend.

## Estrutura do Projeto

```text
curriculo-fit/
|-- backend/
|-- frontend/
|-- docker-compose.yml
`-- README.md
```
