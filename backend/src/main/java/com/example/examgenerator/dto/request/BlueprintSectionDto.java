package com.example.examgenerator.dto.request;

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
public class BlueprintSectionDto {
    private String id;
    private int sectionOrder;
    private String title;
    private UUID subjectId;
    private String subjectName;
    private List<BlueprintSlotDto> slots;
}

