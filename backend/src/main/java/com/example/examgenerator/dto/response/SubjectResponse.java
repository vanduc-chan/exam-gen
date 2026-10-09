package com.example.examgenerator.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SubjectResponse {
    private UUID id;
    private String subjectCode;
    private String subjectName;
    private String description;
    private UUID departmentGroupId;
    private String departmentGroupName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
