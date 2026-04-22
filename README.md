# CurriculoFit

Aplicação fullstack para otimização de currículo com foco em aderência a uma vaga específica.

O projeto recebe:
- Currículo em PDF, Markdown ou TXT
- Descrição da vaga como URL ou texto

E retorna:
- Currículo otimizado em Markdown (sem inventar informações)
- Análise de compatibilidade com score, gaps e recomendações

## Motivação

Este projeto foi desenhado para estudo prático de Java 21 e Spring Boot 3 com IA aplicada, em um cenário real de transição de carreira para desenvolvimento.

## Diagrama de Fluxo (ASCII)

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
[OptimizerService] --prompt--> [Groq (OpenAI-compatible) via Spring AI]
      |
      v
  JSON parse (OptimizeResponse)
      |
      v
[Frontend: CVPreview + FitAnalysis]
```

## Stack

- Backend: Java 21, Spring Boot 3.2.x, Spring AI (Groq/OpenAI-compatible), PDFBox
- Frontend: React 18, Vite, react-markdown
- Build: Maven
- Containers: Docker + Docker Compose
- Testes: JUnit 5 + Mockito + MockMvc

## Pré-requisitos

- Java 21
- Maven 3.9+
- Node.js 20+
- Docker e Docker Compose (opcional)

## Variáveis de Ambiente

- `GROQ_API_KEY`: chave da API do Groq (free tier disponível)
- `CORS_ALLOWED_ORIGINS`: lista de origens permitidas no backend (separadas por vírgula)
- `VITE_API_BASE_URL`: URL base da API consumida pelo frontend
- `RATE_LIMIT_ENABLED`: habilita/desabilita rate limiting no endpoint de otimização
- `RATE_LIMIT_REQUESTS_PER_MINUTE`: limite de requisições por IP/minuto
- `JOB_FETCHER_TIMEOUT_SECONDS`: timeout da busca de vaga por URL
- `JOB_FETCHER_RETRY_MAX_ATTEMPTS`: tentativas totais para busca externa
- `JOB_FETCHER_RETRY_BACKOFF_MS`: backoff inicial (ms) entre tentativas

Você pode usar o arquivo `.env.example` como referência para configurar o ambiente local.

Exemplo no PowerShell:

```powershell
$env:GROQ_API_KEY="sua-chave-aqui"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost"
```

## Rodando Localmente (sem Docker)

### Backend

```powershell
cd backend
mvn spring-boot:run
```

API disponível em `http://localhost:8080`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Interface disponível em `http://localhost:5173`.

Opcionalmente, configure a URL da API pelo Vite:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8080"
```

## Rodando com Docker

Na raiz do projeto:

```powershell
$env:GROQ_API_KEY="sua-chave-aqui"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost"
docker compose up --build
```

Acessos:
- Frontend: `http://localhost`
- Backend: `http://localhost:8080`

## Endpoints da API

### `POST /api/optimize`

- Content-Type: `multipart/form-data`
- Campos:
  - `cvFile`: arquivo PDF/MD/TXT
  - `jobSource`: URL ou texto da vaga (mínimo 20 chars)

#### Exemplo de resposta

```json
{
  "cv_otimizado": "# Nome\n...",
  "analise": {
    "score_compatibilidade": 78,
    "resumo": "Boa aderência geral...",
    "pontos_fortes": ["Java", "Spring Boot"],
    "gaps_criticos": ["AWS"],
    "keywords_presentes": ["REST", "SQL"],
    "keywords_ausentes": ["Kubernetes"],
    "recomendacoes": ["Criar projeto deployável com Docker"]
  }
}
```

## Screenshots

- `docs/screenshots/home.png` (placeholder)
- `docs/screenshots/resultado-curriculo.png` (placeholder)
- `docs/screenshots/resultado-analise.png` (placeholder)

## Decisões Técnicas

- Spring AI: simplifica integração com provedores LLM usando abstrações de chat e prompts.
- Groq com endpoint OpenAI-compatible: integração simples com Spring AI e free tier para testes.
- PDFBox: biblioteca madura e estável para extração de texto de PDFs.
- r.jina.ai: permite extrair texto limpo de URLs de vaga sem scraping customizado.
- React + Vite: setup rápido para UI iterativa e moderna.

## Estrutura do Projeto

```text
curriculo-fit/
├── backend/
├── frontend/
├── docker-compose.yml
└── README.md
```
