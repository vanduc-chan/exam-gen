package com.example.examgenerator.dto.response;

import com.example.examgenerator.dto.request.BlueprintSectionDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamBlueprintResponse {
    private UUID id;
    private String name;
    private String description;
    private List<UUID> courseIds;
    private List<String> courseNames;
    private List<String> courseCodes;
    private List<BlueprintSectionDto> sections;
    private int totalQuestions;
    private double totalScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

