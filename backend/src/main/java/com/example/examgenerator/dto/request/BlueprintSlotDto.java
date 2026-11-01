package com.example.examgenerator.dto.request;

import com.example.examgenerator.enumerate.DifficultyLevel;
import com.example.examgenerator.enumerate.QuestionType;
import com.example.examgenerator.enumerate.SlotSourceType;
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
public class BlueprintSlotDto {
    private String id;
    private int slotOrder;
    private SlotSourceType sourceType;
    private UUID subjectId;
    private String subjectName;
    private QuestionType questionType;
    private DifficultyLevel difficultyLevel;
    private int questionCount;
    private Double score;
    private List<UUID> questionIds;
}

