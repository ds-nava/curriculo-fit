package com.curriculofit.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class CvParserService {

    private static final Logger log = LoggerFactory.getLogger(CvParserService.class);

    public String extract(MultipartFile cvFile) {
        if (cvFile == null || cvFile.isEmpty()) {
            throw new IllegalArgumentException("O arquivo do currículo é obrigatório e não pode estar vazio");
        }

        String originalName = cvFile.getOriginalFilename();
        String fileName = originalName == null ? "" : originalName.toLowerCase(Locale.ROOT);

        log.info("Iniciando parse do currículo: {}", originalName);

        try {
            // Para PDF, usamos o PDFBox para extrair o texto completo de todas as páginas.
            if (fileName.endsWith(".pdf")) {
                return cleanText(extractFromPdf(cvFile));
            }

            // Para Markdown ou TXT, lemos o conteúdo diretamente como UTF-8.
            if (fileName.endsWith(".md") || fileName.endsWith(".txt")) {
                String content = new String(cvFile.getBytes(), StandardCharsets.UTF_8);
                return cleanText(content);
            }
        } catch (IOException ex) {
            throw new RuntimeException("Falha ao ler o arquivo do currículo", ex);
        }

        throw new IllegalArgumentException("Formato de currículo não suportado. Use PDF, MD ou TXT");
    }

    private String extractFromPdf(MultipartFile cvFile) throws IOException {
        // try-with-resources garante fechamento do documento mesmo em caso de erro.
        try (PDDocument document = Loader.loadPDF(cvFile.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String cleanText(String text) {
        if (text == null) {
            return "";
        }

        String normalized = text.replace("\r\n", "\n").trim();
        return normalized.replaceAll("\n{3,}", "\n\n");
    }
}
