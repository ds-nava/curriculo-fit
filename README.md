# CurriculoFit

Aplicação fullstack para otimizar currículos com IA, com foco em aderência a uma vaga específica e geração de análise objetiva de compatibilidade.

[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-green.svg)](./LICENSE)

## Visão geral

O sistema recebe:
- currículo (`PDF`, `MD` ou `TXT`)
- vaga como URL ou texto livre

E retorna:
- currículo otimizado em Markdown
- diagnóstico de compatibilidade (score, pontos fortes, gaps, cobertura e recomendações)

## Arquitetura

```text
Frontend (React/Vite)
   -> POST /api/optimize (multipart: cvFile + jobSource)
Backend (Spring Boot)
   -> CvParserService (extração de texto do currículo)
   -> JobFetcherService (texto da vaga)
   -> OptimizerService (prompt + chamada Groq)
Groq (OpenAI-compatible)
   -> resposta JSON
Backend
   -> normalização/validação da resposta
Frontend
   -> CVPreview + FitAnalysis
```

## Stack

- **Backend:** Java 21, Spring Boot 3, Spring AI, WebClient, PDFBox
- **Frontend:** React 18, Vite, Recharts, React Markdown
- **Build/Testes:** Maven, JUnit 5, Mockito, MockMvc
- **Containers:** Docker, Docker Compose

## Pré-requisitos

- Java 21
- Maven 3.9+
- Node.js 20+
- Docker + Docker Compose (opcional)

## Configuração de ambiente

Use `.env.example` como base.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `GROQ_API_KEY` | Sim (sem BYOK) | Chave padrão do backend para chamadas à IA |
| `CORS_ALLOWED_ORIGINS` | Sim em produção | Origens permitidas no backend (separadas por vírgula) |
| `VITE_API_BASE_URL` | Sim em produção | URL pública do backend usada no build do frontend |
| `RATE_LIMIT_ENABLED` | Não | Ativa/desativa rate limit no `POST /api/optimize` |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | Não | Limite por IP por minuto |
| `JOB_FETCHER_TIMEOUT_SECONDS` | Não | Timeout para leitura de vaga por URL |
| `JOB_FETCHER_RETRY_MAX_ATTEMPTS` | Não | Tentativas de retry para busca externa |
| `JOB_FETCHER_RETRY_BACKOFF_MS` | Não | Backoff inicial (ms) entre tentativas |

### BYOK (Bring Your Own Key)

O frontend permite validar e usar uma chave Groq do usuário:
- enviada via header `X-Groq-Api-Key`
- mantida apenas em memória da aba
- não persistida em banco, storage, cookie ou arquivo
- se ausente, o backend usa `GROQ_API_KEY`

## Execução local (sem Docker)

```powershell
# terminal 1
cd backend
mvn spring-boot:run
```

```powershell
# terminal 2
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## Execução com Docker

```powershell
$env:GROQ_API_KEY="sua-chave"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost"
docker compose up --build
```

- Frontend: `http://localhost`
- Backend: `http://localhost:8080`

Para rodar em segundo plano:

```powershell
docker compose up -d --build
```

Para encerrar:

```powershell
docker compose down
```

## Modo mock no frontend

Arquivo de controle: `frontend/src/testConfig.js`

- `USE_MOCK_DATA = true`: não chama backend/IA
- `USE_MOCK_DATA = false`: fluxo real via `POST /api/optimize`

## API

### `POST /api/optimize`

- **Content-Type:** `multipart/form-data`
- **Campos:** `cvFile`, `jobSource` (mínimo 20 caracteres)
- **Header opcional:** `X-Groq-Api-Key`

### `POST /api/keys/groq/validate`

- **Header obrigatório:** `X-Groq-Api-Key`
- **Retornos típicos:** `200`, `400`, `429`

### Exemplo de resposta de sucesso

```json
{
  "cv_otimizado": "# Nome\n...",
  "analise": {
    "score_compatibilidade": 78,
    "resumo": "Boa aderência geral...",
    "pontos_fortes": ["Java", "Spring Boot"],
    "gaps_criticos": ["AWS"]
  }
}
```

## Healthcheck

- `GET /actuator/health`
- `GET /actuator/health/readiness`

## Testes

```powershell
cd backend
mvn test
```

## Troubleshooting rápido

- **Erro:** "Falha ao chamar o provedor de IA..."
  - valide `GROQ_API_KEY` no ambiente do backend
  - confirme disponibilidade/permissão do modelo configurado
  - teste BYOK via `POST /api/keys/groq/validate`
- **Erro 405 no frontend publicado**
  - revise `VITE_API_BASE_URL` no build
  - confirme que o request está indo para o backend, não para o host do frontend
- **Erro de CORS**
  - ajuste `CORS_ALLOWED_ORIGINS` com o domínio real do frontend publicado

## Estrutura do projeto

```text
curriculo-fit/
|-- backend/
|-- frontend/
|-- docker-compose.yml
|-- LICENSE
`-- README.md
```

## Licença

Este projeto está licenciado sob os termos da **MIT License**. Consulte o arquivo [LICENSE](./LICENSE).
