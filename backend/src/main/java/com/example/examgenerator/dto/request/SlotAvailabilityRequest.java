package com.example.examgenerator.dto.request;

import com.example.examgenerator.enumerate.DifficultyLevel;
import com.example.examgenerator.enumerate.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotAvailabilityRequest {
    private List<UUID> courseIds;
    private UUID subjectId;
    private QuestionType questionType;
    private DifficultyLevel difficultyLevel;
}

