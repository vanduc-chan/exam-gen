package com.example.examgenerator.dto.response;

import com.example.examgenerator.enumerate.ExamStatus;
import com.example.examgenerator.enumerate.ExamStructureType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ExamResponse {
    private UUID id;
    private String code;
    private String title;
    private UUID subjectId;
    private String subjectName;
    private UUID courseId;
    private String courseName;
    private String semester;
    private String academicYear;
    private Integer durationMinutes;
    private ExamStructureType examStructure;
    private Integer numberOfTheories;
    private Integer numberOfPractices;
    private Integer numberOfEssays;
    private Integer numberOfSituations;
    private Integer numberOfExams;
    private ExamStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
