package com.example.examgenerator.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
public class ExamBlueprintRequest {
    @NotBlank(message = "Tên khung đề mẫu không được để trống")
    private String name;

    private String description;

    @NotEmpty(message = "Vui lòng chọn ít nhất một đối tượng áp dụng cho khung đề")
    private List<UUID> courseIds;

    @NotEmpty(message = "Khung đề phải có ít nhất một phần thi (Section)")
    private List<BlueprintSectionDto> sections;
}

