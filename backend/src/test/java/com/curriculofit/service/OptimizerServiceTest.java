package com.curriculofit.service;

import com.curriculofit.dto.OptimizeResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OptimizerServiceTest {

    private OptimizerService optimizerService;

    @Mock
    private CvParserService cvParserService;

    @Mock
    private JobFetcherService jobFetcherService;

    private ChatClient chatClient;

    @BeforeEach
    void setUp() {
        chatClient = mock(ChatClient.class, RETURNS_DEEP_STUBS);

        optimizerService = new OptimizerService(
                chatClient,
                cvParserService,
                jobFetcherService,
                new ObjectMapper(),
          new ByteArrayResource(
            Objects.requireNonNull("CURRÍCULO ORIGINAL:\n{cv}\nDESCRIÇÃO DA VAGA:\n{vaga}".getBytes(StandardCharsets.UTF_8))
          )
        );
    }

    @Test
    void deveFazerParseCorretoDoJsonDeResposta() {
        MockMultipartFile cvFile = new MockMultipartFile("cvFile", "cv.md", "text/markdown", "cv".getBytes());

        String json = """
                {
                  "cv_otimizado": "# CV Otimizado\\n\\n## Resumo\\nDesenvolvedor backend com foco em Java, APIs REST, integrações e arquitetura de serviços.\\n\\n## Experiência\\n- Desenvolveu APIs com Java e Spring Boot, com foco em desempenho, segurança e manutenção.\\n- Estruturou testes, documentação e versionamento para ciclos de entrega previsíveis.\\n- Implementou melhorias de observabilidade, logs de aplicação e tratamento de erros.\\n- Participou de decisões técnicas de modelagem, persistência e integração com serviços externos.",
                  "analise": {
                    "score_compatibilidade": 82,
                    "resumo": "Boa aderência entre stack backend descrita no currículo e os requisitos centrais da vaga, com espaço para evoluir em cloud e containerização.",
                    "pontos_fortes": ["Experiência prática com Java e Spring Boot", "Construção de APIs REST", "Organização técnica de projetos backend"],
                    "gaps_criticos": ["Baixa evidência de cloud pública", "Pouca profundidade em observabilidade", "Ausência de experiência explícita com containers em produção"],
                    "keywords_presentes": ["Java", "Spring Boot", "API REST", "Git", "Backend", "Banco de dados"],
                    "keywords_ausentes": ["Docker", "Kubernetes", "AWS", "CI/CD", "Mensageria", "Observabilidade"],
                    "recomendacoes": ["Adicionar bullet de projeto com deploy automatizado", "Evidenciar métricas de performance entregues", "Incluir experiência com Docker em projeto real", "Descrever integração contínua usada no time", "Destacar responsabilidades de arquitetura em APIs"]
                  }
                }
                """;

        when(cvParserService.extract(cvFile)).thenReturn("Currículo base");
        when(jobFetcherService.fetch("vaga")).thenReturn("Vaga backend Java");
        when(chatClient.prompt().user("CURRÍCULO ORIGINAL:\nCurrículo base\nDESCRIÇÃO DA VAGA:\nVaga backend Java").call().content())
          .thenReturn(json);

        OptimizeResponse response = optimizerService.optimize(cvFile, "vaga");

        assertNotNull(response);
        assertTrue(response.cvOtimizado().startsWith("# CV Otimizado"));
        assertEquals(82, response.analise().scoreCompatibilidade());
    }

    @Test
    void deveFalharQuandoJsonDoModeloForMalformado() {
        MockMultipartFile cvFile = new MockMultipartFile("cvFile", "cv.md", "text/markdown", "cv".getBytes());

        when(cvParserService.extract(cvFile)).thenReturn("Currículo base");
        when(jobFetcherService.fetch("vaga")).thenReturn("Vaga backend Java");
        when(chatClient.prompt().user("CURRÍCULO ORIGINAL:\nCurrículo base\nDESCRIÇÃO DA VAGA:\nVaga backend Java").call().content()).thenReturn("{ json quebrado }");

      IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> optimizerService.optimize(cvFile, "vaga"));

      assertTrue(ex.getMessage().contains("formato inválido"));
    }
}
