package com.example.examgenerator.controller;

import com.example.examgenerator.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/exams/{id}/zip")
    public ResponseEntity<byte[]> exportExamToZip(@PathVariable UUID id) throws IOException {
        byte[] zipBytes = exportService.exportExamToZip(id);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "exams.zip");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(zipBytes);
    }
}
