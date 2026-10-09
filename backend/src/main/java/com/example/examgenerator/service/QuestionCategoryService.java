package com.example.examgenerator.service;

import com.example.examgenerator.entity.QuestionCategory;
import com.example.examgenerator.repository.QuestionCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionCategoryService {

    private final QuestionCategoryRepository questionCategoryRepository;

    @Transactional(readOnly = true)
    public List<QuestionCategory> getAllCategories() {
        return questionCategoryRepository.findAll();
    }
}
