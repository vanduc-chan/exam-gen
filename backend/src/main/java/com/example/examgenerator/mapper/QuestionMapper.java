package com.example.examgenerator.mapper;

import com.example.examgenerator.dto.request.QuestionRequest;
import com.example.examgenerator.dto.response.QuestionResponse;
import com.example.examgenerator.entity.Question;
import com.example.examgenerator.entity.QuestionCategory;
import com.example.examgenerator.entity.Subject;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class QuestionMapper {

    public Question toEntity(QuestionRequest request, QuestionCategory category, Subject subject) {
        if (request == null) {
            return null;
        }

        return Question.builder()
                .code(request.getCode())
                .content(request.getContent())
                .type(request.getType())
                .difficultyLevel(request.getDifficultyLevel())
                .score(request.getScore())
                .answer(request.getAnswer())
                .mediaUrl(request.getMediaUrl())
                .category(category)
                .subject(subject)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    public QuestionResponse toResponse(Question entity) {
        if (entity == null) {
            return null;
        }

        return QuestionResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .content(entity.getContent())
                .type(entity.getType())
                .difficultyLevel(entity.getDifficultyLevel())
                .score(entity.getScore())
                .answer(entity.getAnswer())
                .mediaUrl(entity.getMediaUrl())
                .categoryId(entity.getCategory() != null ? entity.getCategory().getId() : null)
                .categoryName(entity.getCategory() != null ? entity.getCategory().getName() : null)
                .subjectId(entity.getSubject() != null ? entity.getSubject().getId() : null)
                .subjectName(entity.getSubject() != null ? entity.getSubject().getSubjectName() : null)
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public void updateEntityFromRequest(Question entity, QuestionRequest request, QuestionCategory category, Subject subject) {
        if (request == null || entity == null) {
            return;
        }
        entity.setContent(request.getContent());
        entity.setType(request.getType());
        entity.setDifficultyLevel(request.getDifficultyLevel());
        entity.setScore(request.getScore());
        entity.setAnswer(request.getAnswer());
        entity.setMediaUrl(request.getMediaUrl());
        entity.setCategory(category);
        entity.setSubject(subject);
        if (request.getCode() != null) {
            entity.setCode(request.getCode());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
    }
}
