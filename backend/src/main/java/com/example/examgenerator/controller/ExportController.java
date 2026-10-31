package com.example.examgenerator.controller;

import com.example.examgenerator.service.ExportService;
import com.example.examgenerator.repository.ExamRepository;
import com.example.examgenerator.entity.Exam;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;
    private final ExamRepository examRepository;

    @GetMapping("/exams/{id}/word")
    public ResponseEntity<byte[]> exportExamToWord(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "false") boolean includeAnswers) throws IOException {
        byte[] docBytes = exportService.exportExamToWord(id, includeAnswers);
        
        Exam exam = examRepository.findById(id).orElse(null);
        String base = (exam != null && exam.getCode() != null) ? exam.getCode() : "exam";
        String filename = base + (includeAnswers ? "_answer.docx" : "_question.docx");
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        ContentDisposition contentDisposition = ContentDisposition.builder("attachment")
                .filename(filename, StandardCharsets.UTF_8)
                .build();
        headers.setContentDisposition(contentDisposition);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(docBytes);
    }

    @GetMapping("/exams/{id}/word-answers")
    public ResponseEntity<byte[]> exportExamWithAnswersToWord(@PathVariable UUID id) throws IOException {
        return exportExamToWord(id, true);
    }

    @GetMapping("/exams/{id}/zip-questions")
    public ResponseEntity<byte[]> exportQuestionsZip(@PathVariable UUID id) throws IOException {
        byte[] zipBytes = exportService.exportQuestionsZip(id);

        Exam exam = examRepository.findById(id).orElse(null);
        String base = (exam != null && exam.getCode() != null) ? exam.getCode() : "exam";
        String filename = base + "_questions.zip";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("application/zip"));
        ContentDisposition contentDisposition = ContentDisposition.builder("attachment")
                .filename(filename, StandardCharsets.UTF_8)
                .build();
        headers.setContentDisposition(contentDisposition);

        return ResponseEntity.ok()
                .headers(headers)
                .body(zipBytes);
    }

    @GetMapping("/exams/{id}/zip-answers")
    public ResponseEntity<byte[]> exportAnswersZip(@PathVariable UUID id) throws IOException {
        byte[] zipBytes = exportService.exportAnswersZip(id);

        Exam exam = examRepository.findById(id).orElse(null);
        String base = (exam != null && exam.getCode() != null) ? exam.getCode() : "exam";
        String filename = base + "_answers.zip";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("application/zip"));
        ContentDisposition contentDisposition = ContentDisposition.builder("attachment")
                .filename(filename, StandardCharsets.UTF_8)
                .build();
        headers.setContentDisposition(contentDisposition);

        return ResponseEntity.ok()
                .headers(headers)
                .body(zipBytes);
    }
}
