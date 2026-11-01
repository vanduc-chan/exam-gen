package com.example.examgenerator.dto.response;

import com.example.examgenerator.dto.request.BlueprintSectionDto;
import com.example.examgenerator.enumerate.ExamStatus;
import com.example.examgenerator.enumerate.ExamStructureType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ExamResponse {
    private UUID id;
    private String code;
    private String title;
    private String examType;
    private UUID blueprintId;
    private UUID subjectId;
    private String subjectName;
    private List<String> subjectNames;
    private UUID courseId;
    private String courseName;
    private List<UUID> courseIds;
    private List<String> courseNames;
    private List<String> courseCodes;
    private String semester;
    private String academicYear;
    private String unit;
    private String examDate;
    private Integer durationMinutes;
    private ExamStructureType examStructure;
    private Integer numberOfTheories;
    private Integer numberOfPractices;
    private Integer numberOfEssays;
    private Integer numberOfSituations;
    private Integer numberOfExams;
    private Integer examsPerBatch;
    private List<BlueprintSectionDto> sections;
    private ExamStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
