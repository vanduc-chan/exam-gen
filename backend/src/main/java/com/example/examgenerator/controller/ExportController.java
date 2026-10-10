package com.example.examgenerator.controller;

import com.example.examgenerator.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/exams/{id}/word")
    public ResponseEntity<byte[]> exportExamToWord(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "false") boolean includeAnswers) throws IOException {
        byte[] docBytes = exportService.exportExamToWord(id, includeAnswers);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        headers.setContentDispositionFormData("attachment", includeAnswers ? "exams-answers.docx" : "exams.docx");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(docBytes);
    }

    @GetMapping("/exams/{id}/word-answers")
    public ResponseEntity<byte[]> exportExamWithAnswersToWord(@PathVariable UUID id) throws IOException {
        return exportExamToWord(id, true);
    }
}
