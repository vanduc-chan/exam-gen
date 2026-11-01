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
public class GraduationExamRequest {
    @NotBlank(message = "Tên kỳ thi tốt nghiệp không được để trống")
    private String title;

    @NotEmpty(message = "Vui lòng chọn ít nhất một đối tượng dự thi")
    private List<UUID> courseIds;

    private String semester;
    private String academicYear;
    private String unit;
    private String examDate;
    private Integer durationMinutes;
    private Integer numberOfExams;
    private Integer examsPerBatch;
    private UUID blueprintId;

    @NotEmpty(message = "Đề thi tốt nghiệp phải có ít nhất một phần thi (Section)")
    private List<BlueprintSectionDto> sections;

    private Boolean regenerateQuestions;
}

