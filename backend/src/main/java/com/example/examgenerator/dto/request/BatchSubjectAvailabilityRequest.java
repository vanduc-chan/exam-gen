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
public class BatchSubjectAvailabilityRequest {
    private List<UUID> courseIds;
    private List<UUID> subjectIds;
}

