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
        List<String> recomendacoes,

        @JsonProperty("diagnostico_estrutural")
        DiagnosticoEstrutural diagnosticoEstrutural,

        @JsonProperty("cobertura_requisitos")
        List<CoberturaRequisito> coberturaRequisitos,

        @JsonProperty("subscores")
        Subscores subscores
) {

    public record DiagnosticoEstrutural(
            @JsonProperty("estrutura_atual_adequada")
            boolean estruturaAtualAdequada,

            @JsonProperty("motivo_estrutural")
            String motivoEstrutural,

            @JsonProperty("secoes_a_reordenar")
            List<String> secoesAReordenar,

            @JsonProperty("secoes_a_comprimir")
            List<String> secoesAComprimir,

            @JsonProperty("secoes_a_expandir")
            List<String> secoesAExpandir,

            @JsonProperty("novo_outline_sugerido")
            List<String> novoOutlineSugerido
    ) {
    }

    public record CoberturaRequisito(
            @JsonProperty("requisito")
            String requisito,

            @JsonProperty("status")
            String status,

            @JsonProperty("evidencia_curriculo")
            String evidenciaCurriculo,

            @JsonProperty("confianca")
            String confianca
    ) {
    }

    public record Subscores(
            @JsonProperty("aderencia_tecnica")
            int aderenciaTecnica,

            @JsonProperty("aderencia_responsabilidades")
            int aderenciaResponsabilidades,

            @JsonProperty("aderencia_dominio")
            int aderenciaDominio,

            @JsonProperty("clareza_comunicacao")
            int clarezaComunicacao
    ) {
    }
}
