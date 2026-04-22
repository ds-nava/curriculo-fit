package com.curriculofit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.io.IOException;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.Locale;

@Service
public class JobFetcherService {

    private static final Logger log = LoggerFactory.getLogger(JobFetcherService.class);

    private final WebClient webClient;
    private final int timeoutSeconds;
    private final int maxAttempts;
    private final long backoffMs;

    public JobFetcherService(
            WebClient.Builder webClientBuilder,
            @Value("${job-fetcher.timeout-seconds:15}") int timeoutSeconds,
            @Value("${job-fetcher.retry.max-attempts:3}") int maxAttempts,
            @Value("${job-fetcher.retry.backoff-ms:400}") long backoffMs
    ) {
        this.webClient = webClientBuilder.build();
        this.timeoutSeconds = Math.max(1, timeoutSeconds);
        this.maxAttempts = Math.max(1, maxAttempts);
        this.backoffMs = Math.max(0, backoffMs);
    }

    public String fetch(String jobSource) {
        if (jobSource == null || jobSource.isBlank()) {
            throw new IllegalArgumentException("A vaga (URL ou texto) deve ser informada");
        }

        String normalizedSource = jobSource.trim();

        if (normalizedSource.startsWith("http://") || normalizedSource.startsWith("https://")) {
            validateExternalJobUrl(normalizedSource);
            String extractorUrl = "https://r.jina.ai/" + normalizedSource;
            log.info("Buscando descrição da vaga via URL: {}", normalizedSource);

            try {
                return webClient.get()
                        .uri(extractorUrl)
                        .retrieve()
                        .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .retryWhen(
                    Retry.backoff(maxAttempts - 1, Duration.ofMillis(backoffMs))
                        .filter(this::isRetryable)
                )
                        .blockOptional()
                        .orElseThrow(() -> new RuntimeException("A resposta da URL da vaga veio vazia"));
            } catch (IllegalArgumentException ex) {
            throw ex;
            } catch (Exception ex) {
                throw new IllegalArgumentException(
                        "Não foi possível buscar a vaga pela URL informada. Tente colar a descrição da vaga em texto.",
                        ex
                );
            }
        }

        log.info("Usando descrição da vaga enviada diretamente por texto");
        return normalizedSource;
    }

    private void validateExternalJobUrl(String rawUrl) {
        URI uri;
        try {
            uri = URI.create(rawUrl);
        } catch (Exception ex) {
            throw new IllegalArgumentException("URL da vaga inválida");
        }

        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!"http".equals(scheme) && !"https".equals(scheme)) {
            throw new IllegalArgumentException("A URL da vaga deve usar http ou https");
        }

        if (uri.getUserInfo() != null) {
            throw new IllegalArgumentException("URL da vaga inválida");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("URL da vaga inválida");
        }

        String normalizedHost = host.toLowerCase(Locale.ROOT);
        if ("localhost".equals(normalizedHost) || normalizedHost.endsWith(".local")) {
            throw new IllegalArgumentException("A URL da vaga aponta para um host não permitido");
        }

        try {
            InetAddress[] addresses = InetAddress.getAllByName(host);
            for (InetAddress address : addresses) {
                if (isPrivateOrLocalAddress(address)) {
                    throw new IllegalArgumentException("A URL da vaga aponta para um host não permitido");
                }
            }
        } catch (UnknownHostException ex) {
            throw new IllegalArgumentException("Não foi possível resolver o host da URL informada");
        }
    }

    private boolean isPrivateOrLocalAddress(InetAddress address) {
        if (address.isAnyLocalAddress()
                || address.isLoopbackAddress()
                || address.isSiteLocalAddress()
                || address.isLinkLocalAddress()
                || address.isMulticastAddress()) {
            return true;
        }

        if (address instanceof Inet4Address inet4Address) {
            byte[] bytes = inet4Address.getAddress();
            int first = Byte.toUnsignedInt(bytes[0]);
            int second = Byte.toUnsignedInt(bytes[1]);

            if (first == 10 || first == 0 || first == 127) {
                return true;
            }
            if (first == 169 && second == 254) {
                return true;
            }
            if (first == 172 && second >= 16 && second <= 31) {
                return true;
            }
            if (first == 192 && second == 168) {
                return true;
            }
            if (first == 100 && second >= 64 && second <= 127) {
                return true;
            }
            if (first == 198 && (second == 18 || second == 19)) {
                return true;
            }
            return false;
        }

        if (address instanceof Inet6Address inet6Address) {
            byte[] bytes = inet6Address.getAddress();
            return (bytes[0] & (byte) 0xfe) == (byte) 0xfc;
        }

        return false;
    }

    private boolean isRetryable(Throwable throwable) {
        if (throwable instanceof WebClientResponseException responseException) {
            return responseException.getStatusCode().is5xxServerError() || responseException.getStatusCode().value() == 429;
        }
        return throwable instanceof IOException;
    }
}
