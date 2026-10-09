package com.example.examgenerator.service;

import com.example.examgenerator.dto.response.QuestionCategoryResponse;
import com.example.examgenerator.entity.QuestionCategory;
import com.example.examgenerator.mapper.QuestionCategoryMapper;
import com.example.examgenerator.repository.QuestionCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionCategoryService {

    private final QuestionCategoryRepository questionCategoryRepository;
    private final QuestionCategoryMapper questionCategoryMapper;

    @Transactional(readOnly = true)
    public List<QuestionCategoryResponse> getAllCategories() {
        return questionCategoryRepository.findAll().stream()
                .map(questionCategoryMapper::toResponse)
                .collect(Collectors.toList());
    }
}

