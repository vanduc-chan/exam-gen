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

    @NotNull(message = "Đối tượng thi không được để trống")
    private UUID courseId;

    @NotBlank(message = "Học kỳ không được để trống")
    private String semester;

    @NotBlank(message = "Năm học không được để trống")
    private String academicYear;

    private Integer durationMinutes = 90;

    private ExamStructureType examStructure;

    @NotNull(message = "Số lượng đề cần sinh không được để trống")
    @Min(value = 1, message = "Số lượng đề phải lớn hơn 0")
    private Integer numberOfExams;

    private Integer numberOfTheories = 0;
    private Integer numberOfPractices = 0;
    private Integer numberOfEssays = 0;
    private Integer numberOfSituations = 0;

    private Boolean regenerateQuestions = false;
}
