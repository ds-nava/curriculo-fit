package com.curriculofit.service;

import com.curriculofit.dto.FitAnalysis;
import com.curriculofit.dto.OptimizeResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
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

    public OptimizerService(
            ChatClient chatClient,
            CvParserService cvParserService,
            JobFetcherService jobFetcherService,
            ObjectMapper objectMapper,
            @Value("classpath:prompts/optimize.st") Resource promptTemplateResource
    ) {
        this.chatClient = chatClient;
        this.cvParserService = cvParserService;
        this.jobFetcherService = jobFetcherService;
        this.objectMapper = objectMapper;
        this.promptTemplateResource = promptTemplateResource;
    }

    public OptimizeResponse optimize(MultipartFile cvFile, String jobSource) {
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
        String rawResponse = callModel(prompt);

        log.info("Etapa 6/10 - Limpando possíveis markdown fences");
        OptimizeResponse initialResponse = parseOptimizeResponse(rawResponse);

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
            String retryRawResponse = callModel(strictPrompt);
            OptimizeResponse retryResponse = parseOptimizeResponse(retryRawResponse);
            if (!isLowQuality(retryResponse, normalizedCvText, normalizedJobText)) {
                return retryResponse;
            }
            log.warn("Segunda tentativa ainda com baixa densidade. Retornando melhor resultado disponível.");
            return retryResponse;
        } catch (RuntimeException ex) {
            log.warn("Falha na segunda tentativa de geração. Retornando primeira resposta válida.", ex);
            return initialResponse;
        }
    }

    private String callModel(String prompt) {
        try {
            return chatClient.prompt()
                    .user(Objects.requireNonNull(prompt))
                    .call()
                    .content();
        } catch (RuntimeException ex) {
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
                + "    \"recomendacoes\": [\"string\"]\n"
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
                || hasTooFewMeaningfulItems(analise.recomendacoes(), 3);
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
