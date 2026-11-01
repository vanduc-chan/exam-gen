package com.example.examgenerator.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotAvailabilityResponse {
    private long availableCount;
    private boolean valid;
    private String message;
}

