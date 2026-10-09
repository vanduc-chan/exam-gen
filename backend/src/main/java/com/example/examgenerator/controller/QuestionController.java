package com.example.examgenerator.controller;

import com.example.examgenerator.dto.request.QuestionRequest;
import com.example.examgenerator.dto.response.ApiResponse;
import com.example.examgenerator.dto.response.QuestionResponse;
import com.example.examgenerator.enumerate.DifficultyLevel;
import com.example.examgenerator.enumerate.QuestionType;
import com.example.examgenerator.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) UUID subjectId,
            @RequestParam(required = false) QuestionType type,
            @RequestParam(required = false) DifficultyLevel level,
            @RequestParam(required = false) String search) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.success(questionService.getQuestions(subjectId, type, level, search, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestionById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(questionService.getQuestionById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(@Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Thêm câu hỏi thành công", questionService.createQuestion(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @PathVariable UUID id, 
            @Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật câu hỏi thành công", questionService.updateQuestion(id, request)));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteQuestions(@RequestBody List<UUID> ids) {
        questionService.deleteQuestions(ids);
        return ResponseEntity.ok(ApiResponse.success("Xóa câu hỏi thành công", null));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> countActiveQuestions(
            @RequestParam UUID subjectId,
            @RequestParam QuestionType type) {
        return ResponseEntity.ok(ApiResponse.success(questionService.countActiveQuestions(subjectId, type)));
    }

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> importQuestions(
            @RequestParam("file") MultipartFile file,
            @RequestParam("subjectId") UUID subjectId,
            @RequestParam("categoryId") UUID categoryId,
            @RequestParam("type") QuestionType type,
            @RequestParam("difficultyLevel") DifficultyLevel difficultyLevel,
            @RequestParam(value = "score", required = false) Double score) {
        
        List<QuestionResponse> importedQuestions = questionService.importQuestionsFromExcel(
                file, subjectId, categoryId, type, difficultyLevel, score);
        return ResponseEntity.ok(ApiResponse.success("Nhập câu hỏi thành công", importedQuestions));
    }
}
