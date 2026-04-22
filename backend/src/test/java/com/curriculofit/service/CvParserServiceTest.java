package com.curriculofit.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CvParserServiceTest {

    private CvParserService cvParserService;

    @BeforeEach
    void setUp() {
        cvParserService = new CvParserService();
    }

    @Test
    void deveExtrairTextoDePdfValido() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "cvFile",
                "cv-sample.pdf",
                "application/pdf",
                buildPdfBytes("Curriculo de teste Java Spring")
        );

        String extracted = cvParserService.extract(file);

        assertTrue(extracted.toLowerCase().contains("curriculo"));
        assertTrue(extracted.toLowerCase().contains("java"));
    }

    @Test
    void deveLerArquivoMarkdown() throws IOException {
        InputStream mdStream = getClass().getResourceAsStream("/fixtures/cv-sample.md");
        if (mdStream == null) {
            throw new IllegalStateException("Fixture de markdown não encontrada");
        }

        MockMultipartFile file = new MockMultipartFile(
                "cvFile",
                "cv-sample.md",
                "text/markdown",
                mdStream.readAllBytes()
        );

        String extracted = cvParserService.extract(file);

        assertTrue(extracted.contains("Pessoa Candidata"));
        assertTrue(extracted.contains("Spring Boot"));
    }

    @Test
    void deveLancarExcecaoParaFormatoNaoSuportado() {
        MockMultipartFile file = new MockMultipartFile(
                "cvFile",
                "cv.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "conteudo qualquer".getBytes()
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> cvParserService.extract(file));

        assertTrue(ex.getMessage().contains("Formato de currículo não suportado"));
    }

    private byte[] buildPdfBytes(String text) throws IOException {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(50, 700);
                contentStream.showText(text);
                contentStream.endText();
            }

            document.save(output);
            return output.toByteArray();
        }
    }
}
