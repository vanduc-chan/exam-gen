package com.example.examgenerator.dto.request;

import com.example.examgenerator.enumerate.ExamStructureType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ExamRequest {

    @NotBlank(message = "Tên đợt sinh đề không được để trống")
    private String title;

    @NotNull(message = "Môn học không được để trống")
    private UUID subjectId;

    private UUID courseId;
    private java.util.List<UUID> courseIds;

    private String semester = "1";

    private String academicYear;

    private String unit;

    private String examDate;

    private Integer durationMinutes = 90;

    private ExamStructureType examStructure;

    @NotNull(message = "Số lượng bộ đề không được để trống")
    @Min(value = 1, message = "Số lượng bộ đề phải lớn hơn 0")
    private Integer numberOfExams = 1;

    @Min(value = 1, message = "Số đề nhỏ trong mỗi bộ phải lớn hơn 0")
    private Integer examsPerBatch = 20;

    private Integer numberOfTheories = 0;
    private Integer numberOfPractices = 0;
    private Integer numberOfEssays = 0;
    private Integer numberOfSituations = 0;

    private Boolean regenerateQuestions = false;
}
