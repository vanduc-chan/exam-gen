package com.example.examgenerator.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectAvailabilityItemResponse {
    private UUID subjectId;
    private String subjectName;
    private long totalAvailable;
    private Map<String, Long> countByType;
    private boolean valid;
    private String message;
}

