package com.curriculofit.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000;
    private static final int MAX_TRACKED_CLIENTS = 10_000;
    private static final long RETRY_AFTER_SECONDS = 60;

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Value("${security.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${security.rate-limit.requests-per-minute:30}")
    private int requestsPerMinute;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !"/api/optimize".equals(request.getRequestURI()) || !"POST".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    )
            throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        long now = System.currentTimeMillis();
        if (counters.size() > MAX_TRACKED_CLIENTS) {
            counters.entrySet().removeIf(entry -> now - entry.getValue().windowStartMillis > WINDOW_MILLIS * 2);
        }

        String clientId = resolveClientId(request);
        WindowCounter counter = counters.computeIfAbsent(clientId, key -> new WindowCounter(now));

        if (!counter.tryAcquire(now, Math.max(1, requestsPerMinute))) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(RETRY_AFTER_SECONDS));
            response.getWriter().write("{\"timestamp\":\"" + Instant.now() + "\",\"status\":429,\"message\":\"Limite de requisições excedido. Tente novamente em instantes.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientId(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static final class WindowCounter {
        private long windowStartMillis;
        private int requestCount;

        private WindowCounter(long windowStartMillis) {
            this.windowStartMillis = windowStartMillis;
            this.requestCount = 0;
        }

        private synchronized boolean tryAcquire(long now, int limit) {
            if (now - windowStartMillis >= WINDOW_MILLIS) {
                windowStartMillis = now;
                requestCount = 0;
            }

            if (requestCount >= limit) {
                return false;
            }

            requestCount++;
            return true;
        }
    }
}
