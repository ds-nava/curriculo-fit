package com.curriculofit.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record FitAnalysis(
        @JsonProperty("score_compatibilidade")
        int scoreCompatibilidade,

        @JsonProperty("resumo")
        String resumo,

        @JsonProperty("pontos_fortes")
        List<String> pontosFortes,

        @JsonProperty("gaps_criticos")
        List<String> gapsCriticos,

        @JsonProperty("keywords_presentes")
        List<String> keywordsPresentes,

        @JsonProperty("keywords_ausentes")
        List<String> keywordsAusentes,

        @JsonProperty("recomendacoes")
        List<String> recomendacoes
) {
}
