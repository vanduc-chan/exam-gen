package com.example.examgenerator.mapper;

import com.example.examgenerator.dto.request.QuestionRequest;
import com.example.examgenerator.dto.response.CourseResponse;
import com.example.examgenerator.dto.response.QuestionResponse;
import com.example.examgenerator.entity.Question;
import com.example.examgenerator.entity.Subject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class QuestionMapper {

    private final CourseMapper courseMapper;

    public Question toEntity(QuestionRequest request, Subject subject) {
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
                .subject(subject)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    public QuestionResponse toResponse(Question entity) {
        if (entity == null) {
            return null;
        }

        UUID subjectId = null;
        String subjectName = null;
        try {
            if (entity.getSubject() != null) {
                subjectId = entity.getSubject().getId();
                subjectName = entity.getSubject().getSubjectName();
            }
        } catch (Exception ignored) {}

        List<CourseResponse> coursesList = Collections.emptyList();
        try {
            if (entity.getCourses() != null) {
                coursesList = entity.getCourses().stream()
                        .filter(Objects::nonNull)
                        .map(courseMapper::toResponse)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
            }
        } catch (Exception ignored) {}

        return QuestionResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .content(entity.getContent())
                .type(entity.getType())
                .difficultyLevel(entity.getDifficultyLevel())
                .score(entity.getScore())
                .answer(entity.getAnswer())
                .mediaUrl(entity.getMediaUrl())
                .subjectId(subjectId)
                .subjectName(subjectName)
                .courses(coursesList)
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public void updateEntityFromRequest(Question entity, QuestionRequest request, Subject subject) {
        if (request == null || entity == null) {
            return;
        }
        entity.setContent(request.getContent());
        entity.setType(request.getType());
        entity.setDifficultyLevel(request.getDifficultyLevel());
        entity.setScore(request.getScore());
        entity.setAnswer(request.getAnswer());
        entity.setMediaUrl(request.getMediaUrl());
        entity.setSubject(subject);
        if (request.getCode() != null) {
            entity.setCode(request.getCode());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
    }
}
