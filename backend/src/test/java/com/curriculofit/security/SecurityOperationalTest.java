package com.curriculofit.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Objects;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        properties = {
                "security.rate-limit.enabled=true",
                "security.rate-limit.requests-per-minute=2"
        }
)
@AutoConfigureMockMvc
class SecurityOperationalTest {

    @Autowired
    private MockMvc mockMvc;

        private MockMultipartFile buildCvFile() {
                return new MockMultipartFile(
                                "cvFile",
                                "cv.md",
                                "text/markdown",
                                "# CV de teste\nJava\nSpring".getBytes()
                );
        }

    @Test
    void deveBloquearUrlInternaCom400() throws Exception {
        mockMvc.perform(
                        multipart("/api/optimize")
                                .file(Objects.requireNonNull(buildCvFile()))
                                .param("jobSource", "http://127.0.0.1/admin")
                                .header("X-Forwarded-For", "198.51.100.10")
                )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A URL da vaga aponta para um host não permitido"));
    }

    @Test
    void deveAplicarRateLimitERetornar429() throws Exception {
        String clientIp = "198.51.100.20";

        MvcResult first = mockMvc.perform(
                        multipart("/api/optimize")
                                .file(Objects.requireNonNull(buildCvFile()))
                                .param("jobSource", "http://127.0.0.1/admin")
                                .header("X-Forwarded-For", clientIp)
                )
                .andReturn();

        MvcResult second = mockMvc.perform(
                        multipart("/api/optimize")
                                .file(Objects.requireNonNull(buildCvFile()))
                                .param("jobSource", "http://127.0.0.1/admin")
                                .header("X-Forwarded-For", clientIp)
                )
                .andReturn();

        mockMvc.perform(
                        multipart("/api/optimize")
                                .file(Objects.requireNonNull(buildCvFile()))
                                .param("jobSource", "http://127.0.0.1/admin")
                                .header("X-Forwarded-For", clientIp)
                )
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"));

        assertEquals(400, first.getResponse().getStatus());
        assertEquals(400, second.getResponse().getStatus());
    }
}
