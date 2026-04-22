package com.curriculofit.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OptimizeResponse(
        @JsonProperty("cv_otimizado")
        String cvOtimizado,

        @JsonProperty("analise")
        FitAnalysis analise
) {
}
