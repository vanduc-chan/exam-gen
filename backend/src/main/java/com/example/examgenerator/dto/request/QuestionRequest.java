package com.example.examgenerator.dto.request;

import com.example.examgenerator.enumerate.DifficultyLevel;
import com.example.examgenerator.enumerate.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class QuestionRequest {
    private String code;

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String content;

    @NotNull(message = "Loại câu hỏi không được để trống")
    private QuestionType type;

    @NotNull(message = "Độ khó không được để trống")
    private DifficultyLevel difficultyLevel;

    private Double score;

    private String answer;

    private String mediaUrl;

    @NotNull(message = "Danh mục không được để trống")
    private UUID categoryId;

    @NotNull(message = "Môn học không được để trống")
    private UUID subjectId;

    private Boolean isActive = true;
}
