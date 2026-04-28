package com.curriculofit.controller;

import com.curriculofit.dto.FitAnalysis;
import com.curriculofit.dto.OptimizeResponse;
import com.curriculofit.service.OptimizerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OptimizerController.class)
class OptimizerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OptimizerService optimizerService;

    @Test
    void deveRetornar200ComMultipartValido() throws Exception {
        MockMultipartFile cvFile = new MockMultipartFile(
                "cvFile",
                "cv.md",
                "text/markdown",
                "# CV".getBytes()
        );

        OptimizeResponse response = new OptimizeResponse(
                "# CV otimizado",
                new FitAnalysis(
                        75,
                        "Bom alinhamento",
                        List.of("Java"),
                        List.of("Cloud"),
                        List.of("Spring"),
                        List.of("Docker"),
                        List.of("Criar projeto com Docker"),
                        new FitAnalysis.DiagnosticoEstrutural(
                                false,
                                "Estrutura inicial não prioriza os requisitos críticos da vaga.",
                                List.of("Resumo", "Competências", "Experiências"),
                                List.of("Objetivo genérico"),
                                List.of("Projetos"),
                                List.of("Resumo", "Competencias-Chave", "Experiencias Relevantes", "Projetos", "Formacao")
                        ),
                        List.of(
                                new FitAnalysis.CoberturaRequisito(
                                        "Java",
                                        "atende_total",
                                        "Experiência declarada com Java.",
                                        "alta"
                                )
                        ),
                        new FitAnalysis.Subscores(30, 20, 13, 12)
                )
        );

        when(optimizerService.optimize(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(response);

        mockMvc.perform(multipart("/api/optimize")
                        .file(cvFile)
                        .header("X-Groq-Api-Key", "gsk_test_valid_key_1234567890")
                        .param("jobSource", "Descrição de vaga backend Java com Spring Boot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cv_otimizado").value("# CV otimizado"))
                .andExpect(jsonPath("$.analise.score_compatibilidade").value(75));
    }

    @Test
    void deveRetornar400QuandoCvFileAusente() throws Exception {
        mockMvc.perform(multipart("/api/optimize")
                        .param("jobSource", "Descrição de vaga backend Java com Spring Boot"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar429QuandoGroqAtingeLimiteDeTokens() throws Exception {
        MockMultipartFile cvFile = new MockMultipartFile(
                "cvFile",
                "cv.md",
                "text/markdown",
                "# CV".getBytes()
        );

        String mensagem = "O Groq recusou a requisição por limite de tokens do plano atual. Tente novamente em instantes ou envie um CV/vaga menor.";

        when(optimizerService.optimize(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any()))
                .thenThrow(new IllegalArgumentException(mensagem));

        mockMvc.perform(multipart("/api/optimize")
                        .file(cvFile)
                        .param("jobSource", "Descrição de vaga backend Java com Spring Boot"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.message").value(mensagem));
    }

    @Test
    void deveRetornar429QuandoGroqEstiverEmRateLimit() throws Exception {
        MockMultipartFile cvFile = new MockMultipartFile(
                "cvFile",
                "cv.md",
                "text/markdown",
                "# CV".getBytes()
        );

        when(optimizerService.optimize(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any()))
                .thenThrow(new IllegalArgumentException("O Groq recusou a requisição por limite de tokens do plano atual. Tente novamente em instantes ou envie um CV/vaga menor."));

        mockMvc.perform(multipart("/api/optimize")
                        .file(cvFile)
                        .param("jobSource", "Descrição de vaga backend Java com Spring Boot"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429));
    }

    @Test
    void deveValidarApiKeyGroqQuandoHeaderForInformado() throws Exception {
        mockMvc.perform(post("/api/keys/groq/validate")
                        .header("X-Groq-Api-Key", "gsk_test_valid_key_1234567890"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true));
    }
}
