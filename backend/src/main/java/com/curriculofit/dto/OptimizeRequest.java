package com.curriculofit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

public record OptimizeRequest(
        @NotNull(message = "O arquivo do currículo é obrigatório")
        MultipartFile cvFile,

        @NotBlank(message = "A vaga (URL ou texto) é obrigatória")
        @Size(min = 20, message = "A descrição da vaga deve ter ao menos 20 caracteres")
        String jobSource
) {
}
