package com.curriculofit.controller;

import com.curriculofit.dto.OptimizeRequest;
import com.curriculofit.dto.OptimizeResponse;
import com.curriculofit.service.OptimizerService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api")
public class OptimizerController {

    private static final Logger log = LoggerFactory.getLogger(OptimizerController.class);

    private final OptimizerService optimizerService;

    public OptimizerController(OptimizerService optimizerService) {
        this.optimizerService = optimizerService;
    }

    @PostMapping(value = "/optimize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OptimizeResponse> optimize(@Valid @ModelAttribute OptimizeRequest request) {
        log.info("Recebida requisição de otimização de currículo");

        OptimizeResponse response = optimizerService.optimize(request.cvFile(), request.jobSource());
        return ResponseEntity.ok(response);
    }
}
