package com.example.examgenerator.mapper;

import com.example.examgenerator.dto.response.QuestionCategoryResponse;
import com.example.examgenerator.entity.QuestionCategory;
import org.springframework.stereotype.Component;

@Component
public class QuestionCategoryMapper {

    public QuestionCategoryResponse toResponse(QuestionCategory entity) {
        if (entity == null) {
            return null;
        }

        return QuestionCategoryResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
