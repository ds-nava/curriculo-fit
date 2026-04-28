package com.curriculofit.service;

import com.curriculofit.dto.FitAnalysis;
import com.curriculofit.dto.OptimizeResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class OptimizerService {

    private static final Logger log = LoggerFactory.getLogger(OptimizerService.class);
    private static final int MAX_CV_CHARS = 10000;
    private static final int MAX_JOB_CHARS = 5000;

    private final ChatClient chatClient;
    private final CvParserService cvParserService;
    private final JobFetcherService jobFetcherService;
    private final ObjectMapper objectMapper;
    private final Resource promptTemplateResource;
    private final WebClient.Builder webClientBuilder;
    private final String defaultApiKey;
    private final String groqBaseUrl;
    private final String groqModel;
    private final int groqMaxTokens;
    private final double groqTemperature;

    @Autowired
    public OptimizerService(
            ChatClient chatClient,
            CvParserService cvParserService,
            JobFetcherService jobFetcherService,
            ObjectMapper objectMapper,
            @Value("classpath:prompts/optimize.st") Resource promptTemplateResource,
            WebClient.Builder webClientBuilder,
            @Value("${spring.ai.openai.api-key:}") String defaultApiKey,
            @Value("${spring.ai.openai.base-url:https://api.groq.com/openai}") String groqBaseUrl,
            @Value("${spring.ai.openai.chat.options.model:llama-3.3-70b-versatile}") String groqModel,
            @Value("${spring.ai.openai.chat.options.max-tokens:2200}") int groqMaxTokens,
            @Value("${spring.ai.openai.chat.options.temperature:0.2}") double groqTemperature
    ) {
        this.chatClient = chatClient;
        this.cvParserService = cvParserService;
        this.jobFetcherService = jobFetcherService;
        this.objectMapper = objectMapper;
        this.promptTemplateResource = promptTemplateResource;
        this.webClientBuilder = webClientBuilder;
        this.defaultApiKey = defaultApiKey;
        this.groqBaseUrl = groqBaseUrl;
        this.groqModel = groqModel;
        this.groqMaxTokens = groqMaxTokens;
        this.groqTemperature = groqTemperature;
    }

    OptimizerService(
            ChatClient chatClient,
            CvParserService cvParserService,
            JobFetcherService jobFetcherService,
            ObjectMapper objectMapper,
            Resource promptTemplateResource
    ) {
        this(
                chatClient,
                cvParserService,
                jobFetcherService,
                objectMapper,
                promptTemplateResource,
                WebClient.builder(),
                "",
                "https://api.groq.com/openai",
                "llama-3.3-70b-versatile",
                2200,
                0.2
        );
    }

    public OptimizeResponse optimize(MultipartFile cvFile, String jobSource) {
        return optimize(cvFile, jobSource, null);
    }

    public OptimizeResponse optimize(MultipartFile cvFile, String jobSource, String userGroqApiKey) {
        log.info("Etapa 1/10 - Extraindo texto do currículo");
        String cvText = cvParserService.extract(cvFile);

        log.info("Etapa 2/10 - Buscando texto da vaga");
        String jobText = jobFetcherService.fetch(jobSource);

        log.info("Etapa 2.1/10 - Ajustando tamanho de contexto para o modelo");
        String normalizedCvText = limitTextForPrompt(cvText, MAX_CV_CHARS, "currículo");
        String normalizedJobText = limitTextForPrompt(jobText, MAX_JOB_CHARS, "vaga");

        log.info("Etapa 3/10 - Lendo template do prompt");
        String template = loadPromptTemplate();

        log.info("Etapa 4/10 - Interpolando dados no prompt");
        String prompt = template.replace("{cv}", normalizedCvText).replace("{vaga}", normalizedJobText);

        log.info("Etapa 5/10 - Chamando modelo Groq via Spring AI (OpenAI-compatible)");
        String rawResponse = callModel(prompt, userGroqApiKey);

        log.info("Etapa 6/10 - Limpando possíveis markdown fences");
        OptimizeResponse initialResponse = enrichMissingAnalysis(parseOptimizeResponse(rawResponse));

        if (!isLowQuality(initialResponse, normalizedCvText, normalizedJobText)) {
            return initialResponse;
        }

        log.warn("Etapa 7/10 - Primeira resposta considerada rasa. Executando segunda tentativa com instruções rigorosas");
        String strictPrompt = prompt + "\n\n"
            + "MODO RIGOROSO (OBRIGATÓRIO): reescreva a resposta inteira com maior profundidade, mantendo apenas fatos presentes no currículo. "
            + "É proibido retornar o cv_otimizado igual ou quase igual ao currículo original. "
            + "Faça mudanças perceptíveis de estrutura e conteúdo para aderência à vaga: reordene seções, reescreva bullets com foco em impacto e destaque os itens mais relevantes no topo. "
            + "Entregue recomendações acionáveis e específicas para a vaga, sem frases genéricas.";

        try {
            String retryRawResponse = callModel(strictPrompt, userGroqApiKey);
            OptimizeResponse retryResponse = enrichMissingAnalysis(parseOptimizeResponse(retryRawResponse));
            if (!isLowQuality(retryResponse, normalizedCvText, normalizedJobText)) {
                return retryResponse;
            }
            log.warn("Segunda tentativa ainda com baixa densidade. Retornando melhor resultado disponível.");
            return initialResponse;
        } catch (RuntimeException ex) {
            log.warn("Falha na segunda tentativa de geração. Retornando primeira resposta válida.", ex);
            return initialResponse;
        }
    }

    public void validateGroqApiKey(String userGroqApiKey) {
        String normalizedUserKey = normalizeOptionalUserApiKey(userGroqApiKey);
        if (normalizedUserKey == null) {
            throw new IllegalArgumentException("Informe uma API key Groq para validar.");
        }

        callGroqModelsEndpoint(normalizedUserKey);
    }

    private OptimizeResponse enrichMissingAnalysis(OptimizeResponse response) {
        if (response == null || response.analise() == null) {
            return response;
        }

        FitAnalysis analise = response.analise();
        int score = Math.max(0, Math.min(100, analise.scoreCompatibilidade()));

        FitAnalysis.DiagnosticoEstrutural diagnostico = analise.diagnosticoEstrutural();
        if (diagnostico == null) {
            boolean estruturaAdequada = score >= 75;
            List<String> reordenar = estruturaAdequada
                    ? List.of("Priorização por aderência")
                    : List.of("Resumo", "Competências", "Experiências Relevantes");
            List<String> comprimir = safeList(analise.gapsCriticos()).isEmpty()
                    ? List.of("Seções genéricas sem aderência direta")
                    : List.of("Experiências pouco aderentes à vaga");
            List<String> expandir = safeList(analise.pontosFortes()).isEmpty()
                    ? List.of("Experiências com resultados")
                    : List.of("Pontos fortes aderentes à vaga");

            diagnostico = new FitAnalysis.DiagnosticoEstrutural(
                    estruturaAdequada,
                    defaultText(analise.resumo(), "Estrutura inferida automaticamente por ausência de diagnóstico detalhado da IA."),
                    reordenar,
                    comprimir,
                    expandir,
                    List.of("Resumo", "Competencias-Chave", "Experiencias Relevantes", "Projetos", "Formacao")
            );
        }

        List<FitAnalysis.CoberturaRequisito> cobertura = analise.coberturaRequisitos();
        if (isEmptyList(cobertura)) {
            cobertura = buildFallbackCoverage(analise);
        }

        FitAnalysis.Subscores subscores = analise.subscores();
        if (subscores == null) {
            subscores = buildFallbackSubscores(score);
        }

        FitAnalysis enrichedAnalysis = new FitAnalysis(
                score,
                analise.resumo(),
                analise.pontosFortes(),
                analise.gapsCriticos(),
                analise.keywordsPresentes(),
                analise.keywordsAusentes(),
                analise.recomendacoes(),
                diagnostico,
                cobertura,
                subscores
        );

        return new OptimizeResponse(response.cvOtimizado(), enrichedAnalysis);
    }

    private List<FitAnalysis.CoberturaRequisito> buildFallbackCoverage(FitAnalysis analise) {
        List<FitAnalysis.CoberturaRequisito> coverage = new ArrayList<>();

        for (String keyword : safeList(analise.keywordsPresentes()).stream().limit(3).toList()) {
            coverage.add(new FitAnalysis.CoberturaRequisito(
                    keyword,
                    "atende_parcial",
                    "Keyword identificada no currículo: " + keyword,
                    "media"
            ));
        }

        for (String keyword : safeList(analise.keywordsAusentes()).stream().limit(2).toList()) {
            coverage.add(new FitAnalysis.CoberturaRequisito(
                    keyword,
                    "nao_atende",
                    "Keyword não evidenciada no currículo otimizado.",
                    "media"
            ));
        }

        if (coverage.isEmpty()) {
            coverage.add(new FitAnalysis.CoberturaRequisito(
                    "Aderência geral da vaga",
                    "atende_parcial",
                    defaultText(analise.resumo(), "Sem evidências detalhadas retornadas pela IA."),
                    "baixa"
            ));
        }

        return coverage;
    }

    private FitAnalysis.Subscores buildFallbackSubscores(int score) {
        int tecnica = Math.max(0, Math.min(40, (int) Math.round(score * 0.40)));
        int responsabilidades = Math.max(0, Math.min(25, (int) Math.round(score * 0.25)));
        int dominio = Math.max(0, Math.min(20, (int) Math.round(score * 0.20)));
        int clareza = score - tecnica - responsabilidades - dominio;
        clareza = Math.max(0, Math.min(15, clareza));

        return new FitAnalysis.Subscores(tecnica, responsabilidades, dominio, clareza);
    }

    private List<String> safeList(List<String> values) {
        return values == null ? List.of() : values;
    }

    private String defaultText(String value, String fallback) {
        return isBlank(value) ? fallback : value;
    }

    private String callModel(String prompt, String userGroqApiKey) {
        try {
            String normalizedUserKey = normalizeOptionalUserApiKey(userGroqApiKey);
            if (normalizedUserKey != null) {
                return callGroqChatCompletion(prompt, normalizedUserKey);
            }

            if (isBlank(defaultApiKey)) {
                throw new IllegalArgumentException("Falha ao chamar o provedor de IA. Verifique GROQ_API_KEY, limites do plano e disponibilidade do modelo.");
            }

            return chatClient.prompt()
                    .user(Objects.requireNonNull(prompt))
                    .call()
                    .content();
        } catch (RuntimeException ex) {
            if (ex instanceof IllegalArgumentException illegalArgumentException) {
                throw illegalArgumentException;
            }

            String providerMessage = ex.getMessage() == null ? "" : ex.getMessage();
            if (isGroqTokenLimitError(providerMessage)) {
                log.error("Groq rejeitou a requisição por limite de tokens. charsPrompt={}, detalhe='{}'",
                        prompt.length(), providerMessage, ex);
                throw new IllegalArgumentException(
                        "O Groq recusou a requisição por limite de tokens do plano atual. Tente novamente em instantes ou envie um CV/vaga menor.",
                        ex
                );
            }

            log.error("Falha ao chamar Groq. charsPrompt={}, detalhe='{}'",
                    prompt.length(), providerMessage, ex);
            throw new IllegalArgumentException(
                    "Falha ao chamar o provedor de IA. Verifique GROQ_API_KEY, limites do plano e disponibilidade do modelo.",
                    ex
            );
        }
    }

    private String callModel(String prompt) {
        return callModel(prompt, null);
    }

    private String callGroqChatCompletion(String prompt, String apiKey) {
        Map<String, Object> payload = Map.of(
                "model", groqModel,
                "max_tokens", groqMaxTokens,
                "temperature", groqTemperature,
                "messages", List.of(Map.of("role", "user", "content", Objects.requireNonNull(prompt)))
        );

        try {
            JsonNode response = webClientBuilder.build()
                    .post()
                    .uri(buildGroqUrl("/v1/chat/completions"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response == null) {
                throw new IllegalArgumentException("O provedor de IA retornou resposta vazia.");
            }

            String content = response.path("choices").path(0).path("message").path("content").asText("");
            if (isBlank(content)) {
                throw new IllegalArgumentException("O provedor de IA não retornou conteúdo na resposta.");
            }

            return content;
        } catch (WebClientResponseException ex) {
            throw mapGroqError(ex);
        }
    }

    private void callGroqModelsEndpoint(String apiKey) {
        try {
            webClientBuilder.build()
                    .get()
                    .uri(buildGroqUrl("/v1/models"))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
        } catch (WebClientResponseException ex) {
            throw mapGroqError(ex);
        }
    }

    private RuntimeException mapGroqError(WebClientResponseException ex) {
        int statusCode = ex.getStatusCode().value();
        if (statusCode == 401 || statusCode == 403) {
            return new IllegalArgumentException("API key Groq inválida ou sem permissão para o recurso.");
        }
        if (statusCode == 429) {
            return new IllegalArgumentException("Limite de requisições/tokens da API Groq atingido. Tente novamente em instantes.");
        }
        if (statusCode >= 500) {
            return new IllegalArgumentException("A Groq está indisponível no momento. Tente novamente em instantes.");
        }
        return new IllegalArgumentException("Falha ao comunicar com a Groq. Código HTTP: " + statusCode + ".");
    }

    private String normalizeOptionalUserApiKey(String userGroqApiKey) {
        if (userGroqApiKey == null) {
            return null;
        }

        String normalized = userGroqApiKey.trim();
        if (normalized.isEmpty()) {
            return null;
        }

        if (normalized.length() < 20) {
            throw new IllegalArgumentException("API key Groq inválida.");
        }

        return normalized;
    }

    private String buildGroqUrl(String path) {
        String normalizedBase = groqBaseUrl == null ? "" : groqBaseUrl.trim();
        if (normalizedBase.endsWith("/")) {
            normalizedBase = normalizedBase.substring(0, normalizedBase.length() - 1);
        }
        if (path.startsWith("/")) {
            return normalizedBase + path;
        }
        return normalizedBase + "/" + path;
    }

    private OptimizeResponse parseOptimizeResponse(String rawResponse) {
        String cleanedResponse = stripMarkdownFences(rawResponse);
        String jsonResponse = extractFirstJsonObject(cleanedResponse);

        log.info("Etapa 7/10 - Deserializando JSON para OptimizeResponse");
        try {
            return objectMapper.readValue(jsonResponse, OptimizeResponse.class);
        } catch (JsonProcessingException ex) {
            log.warn("Resposta da IA veio em formato inválido. Tentando reparo automático de JSON.", ex);
            return tryRepairMalformedJson(cleanedResponse, ex);
        }
    }

    private OptimizeResponse tryRepairMalformedJson(String rawModelOutput, Exception originalException) {
        String repairPrompt = "Você é um reparador de JSON. "
                + "Converta o conteúdo abaixo para JSON válido seguindo exatamente o schema informado. "
                + "Responda SOMENTE com JSON válido, sem markdown, sem comentários e sem texto extra.\n\n"
                + "SCHEMA:\n"
                + "{\n"
                + "  \"cv_otimizado\": \"string\",\n"
                + "  \"analise\": {\n"
                + "    \"score_compatibilidade\": 0,\n"
                + "    \"resumo\": \"string\",\n"
                + "    \"pontos_fortes\": [\"string\"],\n"
                + "    \"gaps_criticos\": [\"string\"],\n"
                + "    \"keywords_presentes\": [\"string\"],\n"
                + "    \"keywords_ausentes\": [\"string\"],\n"
                + "    \"recomendacoes\": [\"string\"],\n"
                + "    \"diagnostico_estrutural\": {\n"
                + "      \"estrutura_atual_adequada\": false,\n"
                + "      \"motivo_estrutural\": \"string\",\n"
                + "      \"secoes_a_reordenar\": [\"string\"],\n"
                + "      \"secoes_a_comprimir\": [\"string\"],\n"
                + "      \"secoes_a_expandir\": [\"string\"],\n"
                + "      \"novo_outline_sugerido\": [\"string\"]\n"
                + "    },\n"
                + "    \"cobertura_requisitos\": [\n"
                + "      {\n"
                + "        \"requisito\": \"string\",\n"
                + "        \"status\": \"atende_parcial|atende_total|nao_atende\",\n"
                + "        \"evidencia_curriculo\": \"string\",\n"
                + "        \"confianca\": \"alta|media|baixa\"\n"
                + "      }\n"
                + "    ],\n"
                + "    \"subscores\": {\n"
                + "      \"aderencia_tecnica\": 0,\n"
                + "      \"aderencia_responsabilidades\": 0,\n"
                + "      \"aderencia_dominio\": 0,\n"
                + "      \"clareza_comunicacao\": 0\n"
                + "    }\n"
                + "  }\n"
                + "}\n\n"
                + "CONTEÚDO PARA REPARO:\n"
                + rawModelOutput;

        try {
            String repairedRaw = callModel(repairPrompt);
            String repairedCleaned = stripMarkdownFences(repairedRaw);
            String repairedJson = extractFirstJsonObject(repairedCleaned);
            return objectMapper.readValue(repairedJson, OptimizeResponse.class);
        } catch (Exception repairEx) {
            throw new IllegalArgumentException(
                    "A IA retornou uma resposta em formato inválido. Tente novamente em alguns segundos.",
                    originalException
            );
        }
    }

    private boolean isLowQuality(OptimizeResponse response, String cvText, String jobText) {
        if (response == null || response.analise() == null) {
            return true;
        }

        FitAnalysis analise = response.analise();
        int score = analise.scoreCompatibilidade();
        if (score < 0 || score > 100) {
            return true;
        }

        int minCvLength = Math.max(280, Math.min(1200, cvText.length() / 2));
        if (isBlank(response.cvOtimizado()) || response.cvOtimizado().trim().length() < minCvLength) {
            return true;
        }

        if (isEffectivelyUnchanged(cvText, response.cvOtimizado())) {
            log.warn("cv_otimizado está muito similar ao currículo original; tratando resposta como baixa qualidade");
            return true;
        }

        if (isBlank(analise.resumo()) || analise.resumo().trim().length() < 80) {
            return true;
        }

        return hasTooFewMeaningfulItems(analise.pontosFortes(), 2)
                || hasTooFewMeaningfulItems(analise.gapsCriticos(), 2)
                || hasTooFewMeaningfulItems(analise.keywordsPresentes(), Math.min(6, expectedKeywordsThreshold(jobText)))
                || hasTooFewMeaningfulItems(analise.keywordsAusentes(), Math.min(6, expectedKeywordsThreshold(jobText)))
                || hasTooFewMeaningfulItems(analise.recomendacoes(), 3)
                || isStructuralAnalysisLowQuality(analise)
                || isCoverageLowQuality(analise)
                || isSubscoresLowQuality(analise);
    }

    private boolean isStructuralAnalysisLowQuality(FitAnalysis analise) {
        FitAnalysis.DiagnosticoEstrutural diagnostico = analise.diagnosticoEstrutural();
        if (diagnostico == null || isBlank(diagnostico.motivoEstrutural())) {
            return true;
        }

        boolean hasAnyStructuralAction = !isEmptyList(diagnostico.secoesAReordenar())
                || !isEmptyList(diagnostico.secoesAComprimir())
                || !isEmptyList(diagnostico.secoesAExpandir())
                || !isEmptyList(diagnostico.novoOutlineSugerido());

        return !hasAnyStructuralAction;
    }

    private boolean isCoverageLowQuality(FitAnalysis analise) {
        if (isEmptyList(analise.coberturaRequisitos())) {
            return true;
        }

        return analise.coberturaRequisitos().stream().anyMatch(item ->
                item == null
                        || isBlank(item.requisito())
                        || isBlank(item.evidenciaCurriculo())
                        || !isAllowedCoverageStatus(item.status())
                        || !isAllowedConfidence(item.confianca())
        );
    }

    private boolean isSubscoresLowQuality(FitAnalysis analise) {
        FitAnalysis.Subscores subscores = analise.subscores();
        if (subscores == null) {
            return true;
        }

        boolean outOfRange = !isWithin(subscores.aderenciaTecnica(), 0, 40)
                || !isWithin(subscores.aderenciaResponsabilidades(), 0, 25)
                || !isWithin(subscores.aderenciaDominio(), 0, 20)
                || !isWithin(subscores.clarezaComunicacao(), 0, 15);
        if (outOfRange) {
            return true;
        }

        int sum = subscores.aderenciaTecnica()
                + subscores.aderenciaResponsabilidades()
                + subscores.aderenciaDominio()
                + subscores.clarezaComunicacao();

        return Math.abs(sum - analise.scoreCompatibilidade()) > 15;
    }

    private boolean isAllowedCoverageStatus(String status) {
        String normalized = status == null ? "" : status.trim().toLowerCase();
        return "atende_parcial".equals(normalized)
                || "atende_total".equals(normalized)
                || "nao_atende".equals(normalized);
    }

    private boolean isAllowedConfidence(String confidence) {
        String normalized = confidence == null ? "" : confidence.trim().toLowerCase();
        return "alta".equals(normalized)
                || "media".equals(normalized)
                || "baixa".equals(normalized);
    }

    private boolean isWithin(int value, int min, int max) {
        return value >= min && value <= max;
    }

    private boolean isEmptyList(List<?> values) {
        return values == null || values.isEmpty();
    }

    private boolean isEffectivelyUnchanged(String originalCv, String optimizedCv) {
        String normalizedOriginal = normalizeForComparison(originalCv);
        String normalizedOptimized = normalizeForComparison(optimizedCv);

        if (normalizedOriginal.isEmpty() || normalizedOptimized.isEmpty()) {
            return false;
        }

        if (normalizedOriginal.equals(normalizedOptimized)) {
            return true;
        }

        double tokenSimilarity = jaccardSimilarity(tokenize(normalizedOriginal), tokenize(normalizedOptimized));
        double lengthRatio = (double) Math.min(normalizedOriginal.length(), normalizedOptimized.length())
                / Math.max(normalizedOriginal.length(), normalizedOptimized.length());

        if (tokenSimilarity >= 0.93 && lengthRatio >= 0.90) {
            return true;
        }

        double lineReuse = lineReuseRatio(originalCv, optimizedCv);
        return lineReuse >= 0.85;
    }

    private String normalizeForComparison(String value) {
        if (value == null) {
            return "";
        }

        String onlyAsciiWordAndSpace = value
                .toLowerCase()
                .replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();

        return onlyAsciiWordAndSpace;
    }

    private Set<String> tokenize(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }

        return new HashSet<>(Arrays.asList(value.split("\\s+")));
    }

    private double jaccardSimilarity(Set<String> left, Set<String> right) {
        if (left.isEmpty() || right.isEmpty()) {
            return 0.0;
        }

        Set<String> intersection = new HashSet<>(left);
        intersection.retainAll(right);

        Set<String> union = new HashSet<>(left);
        union.addAll(right);

        if (union.isEmpty()) {
            return 0.0;
        }

        return (double) intersection.size() / union.size();
    }

    private double lineReuseRatio(String original, String optimized) {
        if (isBlank(original) || isBlank(optimized)) {
            return 0.0;
        }

        Set<String> originalLines = Arrays.stream(original.split("\\R"))
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .map(this::normalizeForComparison)
                .filter(line -> !line.isBlank())
                .collect(java.util.stream.Collectors.toSet());

        List<String> optimizedLines = Arrays.stream(optimized.split("\\R"))
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .map(this::normalizeForComparison)
                .filter(line -> !line.isBlank())
                .toList();

        if (originalLines.isEmpty() || optimizedLines.isEmpty()) {
            return 0.0;
        }

        long reused = optimizedLines.stream().filter(originalLines::contains).count();
        return (double) reused / optimizedLines.size();
    }

    private int expectedKeywordsThreshold(String jobText) {
        if (isBlank(jobText)) {
            return 4;
        }

        int commas = (int) jobText.chars().filter(ch -> ch == ',').count();
        int lineBreaks = (int) jobText.chars().filter(ch -> ch == '\n').count();
        int hints = commas + lineBreaks;
        return Math.max(4, Math.min(10, hints));
    }

    private boolean hasTooFewMeaningfulItems(List<String> items, int minItems) {
        if (items == null) {
            return true;
        }

        long meaningfulCount = items.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(item -> !item.isBlank() && item.length() >= 3)
                .count();

        return meaningfulCount < minItems;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String loadPromptTemplate() {
        try {
            return StreamUtils.copyToString(
                    promptTemplateResource.getInputStream(),
                    Objects.requireNonNull(StandardCharsets.UTF_8)
            );
        } catch (IOException ex) {
            throw new RuntimeException("Não foi possível carregar o template de prompt optimize.st", ex);
        }
    }

    private String stripMarkdownFences(String response) {
        if (response == null) {
            return "";
        }

        String cleaned = response.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:json)?\\s*", "");
            cleaned = cleaned.replaceFirst("\\s*```$", "");
        }
        return cleaned.trim();
    }

    private String extractFirstJsonObject(String response) {
        String text = response == null ? "" : response.trim();
        int start = text.indexOf('{');
        if (start < 0) {
            return text;
        }

        int depth = 0;
        boolean inString = false;
        boolean escaped = false;

        for (int i = start; i < text.length(); i++) {
            char c = text.charAt(i);

            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (c == '\\') {
                    escaped = true;
                } else if (c == '"') {
                    inString = false;
                }
                continue;
            }

            if (c == '"') {
                inString = true;
                continue;
            }

            if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) {
                    return text.substring(start, i + 1);
                }
            }
        }

        return text;
    }

    private String limitTextForPrompt(String text, int limit, String sourceName) {
        String normalized = text == null ? "" : text.trim();
        if (normalized.length() <= limit) {
            return normalized;
        }

        log.warn("Texto de {} truncado para reduzir tokens enviados ao Groq. originalChars={}, limiteChars={}",
                sourceName, normalized.length(), limit);
        return normalized.substring(0, limit);
    }

    private boolean isGroqTokenLimitError(String message) {
        String normalized = message == null ? "" : message.toLowerCase();
        return normalized.contains("request too large")
                || normalized.contains("tokens per minute")
                || normalized.contains("rate_limit_exceeded")
                || normalized.contains("token");
    }
}
