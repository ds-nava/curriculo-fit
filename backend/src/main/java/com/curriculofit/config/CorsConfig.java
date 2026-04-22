package com.curriculofit.config;

import org.springframework.lang.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.Objects;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        String[] parsedAllowedOrigins = Arrays.stream(Objects.requireNonNull(allowedOrigins).split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);

        if (parsedAllowedOrigins.length == 0) {
            throw new IllegalStateException("Nenhuma origem CORS válida foi configurada em cors.allowed-origins");
        }

        registry.addMapping("/api/**")
                .allowedOrigins(parsedAllowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
