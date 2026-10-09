package com.example.examgenerator.controller;

import com.example.examgenerator.dto.response.ApiResponse;
import com.example.examgenerator.entity.QuestionCategory;
import com.example.examgenerator.service.QuestionCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/question-categories")
@RequiredArgsConstructor
public class QuestionCategoryController {

    private final QuestionCategoryService questionCategoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuestionCategory>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(questionCategoryService.getAllCategories()));
    }
}
