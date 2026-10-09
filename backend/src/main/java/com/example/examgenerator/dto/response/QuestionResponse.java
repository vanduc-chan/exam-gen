package com.example.examgenerator.dto.response;

import com.example.examgenerator.enumerate.DifficultyLevel;
import com.example.examgenerator.enumerate.QuestionType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class QuestionResponse {
    private UUID id;
    private String code;
    private String content;
    private QuestionType type;
    private DifficultyLevel difficultyLevel;
    private Double score;
    private String answer;
    private String mediaUrl;
    private UUID categoryId;
    private String categoryName;
    private UUID subjectId;
    private String subjectName;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
