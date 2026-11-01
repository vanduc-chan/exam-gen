package com.example.examgenerator.mapper;

import com.example.examgenerator.dto.request.BlueprintSectionDto;
import com.example.examgenerator.dto.request.BlueprintSlotDto;
import com.example.examgenerator.dto.request.ExamRequest;
import com.example.examgenerator.dto.response.ExamResponse;
import com.example.examgenerator.entity.Course;
import com.example.examgenerator.entity.Exam;
import com.example.examgenerator.entity.Subject;
import com.example.examgenerator.enumerate.ExamStatus;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
public class ExamMapper {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Exam toEntity(ExamRequest request, Subject subject, Course course) {
        Set<Course> courses = course != null ? Collections.singleton(course) : Collections.emptySet();
        return toEntity(request, subject, courses);
    }

    public Exam toEntity(ExamRequest request, Subject subject, Set<Course> courses) {
        if (request == null) {
            return null;
        }

        Course primaryCourse = (courses != null && !courses.isEmpty()) ? courses.iterator().next() : null;

        java.time.LocalDateTime parsedExamDate = null;
        if (request.getExamDate() != null && !request.getExamDate().trim().isEmpty()) {
            try {
                String s = request.getExamDate().trim();
                if (s.length() == 10) {
                    parsedExamDate = java.time.LocalDate.parse(s).atStartOfDay();
                } else {
                    parsedExamDate = java.time.LocalDateTime.parse(s);
                }
            } catch (Exception ignored) {}
        }

        String academicYear = request.getAcademicYear();
        if (academicYear == null || academicYear.trim().isEmpty()) {
            int y = parsedExamDate != null ? parsedExamDate.getYear() : java.time.LocalDate.now().getYear();
            academicYear = y + "-" + (y + 1);
        }

        return Exam.builder()
                .title(request.getTitle())
                .examType("SUBJECT")
                .subject(subject)
                .course(primaryCourse)
                .courses(courses != null ? courses : Collections.emptySet())
                .semester(request.getSemester())
                .academicYear(academicYear)
                .unit(request.getUnit())
                .examDate(parsedExamDate)
                .durationMinutes(request.getDurationMinutes())
                .examStructure(request.getExamStructure())
                .numberOfTheories(request.getNumberOfTheories())
                .numberOfPractices(request.getNumberOfPractices())
                .numberOfEssays(request.getNumberOfEssays())
                .numberOfSituations(request.getNumberOfSituations())
                .numberOfExams(request.getNumberOfExams())
                .status(ExamStatus.GENERATED)
                .build();
    }

    public ExamResponse toResponse(Exam entity) {
        if (entity == null) {
            return null;
        }

        List<UUID> courseIds = new ArrayList<>();
        List<String> courseNames = new ArrayList<>();
        List<String> courseCodes = new ArrayList<>();

        try {
            if (entity.getCourses() != null && !entity.getCourses().isEmpty()) {
                for (Course c : entity.getCourses()) {
                    if (c != null) {
                        if (c.getId() != null) courseIds.add(c.getId());
                        if (c.getName() != null) courseNames.add(c.getName());
                        if (c.getCourseCode() != null) courseCodes.add(c.getCourseCode());
                    }
                }
            } else if (entity.getCourse() != null) {
                Course c = entity.getCourse();
                if (c.getId() != null) courseIds.add(c.getId());
                if (c.getName() != null) courseNames.add(c.getName());
                if (c.getCourseCode() != null) courseCodes.add(c.getCourseCode());
            }
        } catch (Exception ignored) {}

        UUID primaryCourseId = !courseIds.isEmpty() ? courseIds.get(0) : null;
        String formattedCourseName = !courseNames.isEmpty() ? String.join(", ", courseNames) : null;

        UUID subjectId = null;
        String subjectName = null;
        try {
            if (entity.getSubject() != null) {
                subjectId = entity.getSubject().getId();
                subjectName = entity.getSubject().getSubjectName();
            }
        } catch (Exception ignored) {}

        List<BlueprintSectionDto> sections = null;
        Set<String> distinctSubjectNames = new LinkedHashSet<>();
        if (entity.getBlueprintSnapshot() != null && !entity.getBlueprintSnapshot().trim().isEmpty()) {
            try {
                sections = objectMapper.readValue(
                        entity.getBlueprintSnapshot(),
                        new TypeReference<List<BlueprintSectionDto>>() {}
                );
                if (sections != null) {
                    for (BlueprintSectionDto sec : sections) {
                        if (sec.getSubjectName() != null && !sec.getSubjectName().isBlank()) {
                            distinctSubjectNames.add(sec.getSubjectName().trim());
                        }
                        if (sec.getSlots() != null) {
                            for (BlueprintSlotDto slot : sec.getSlots()) {
                                if (slot.getSubjectName() != null && !slot.getSubjectName().isBlank()) {
                                    distinctSubjectNames.add(slot.getSubjectName().trim());
                                }
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        if (distinctSubjectNames.isEmpty() && subjectName != null) {
            distinctSubjectNames.add(subjectName);
        }
        if ("GRADUATION".equalsIgnoreCase(entity.getExamType()) && !distinctSubjectNames.isEmpty()) {
            subjectName = String.join(", ", distinctSubjectNames);
        }

        int examsPerBatch = 0;
        try {
            if (entity.getExamDetails() != null && !entity.getExamDetails().isEmpty()) {
                int firstBatch = entity.getExamDetails().get(0).getBatchNumber();
                long count = entity.getExamDetails().stream()
                        .filter(d -> d.getBatchNumber() == firstBatch)
                        .count();
                examsPerBatch = (int) count;
            }
        } catch (Exception ignored) {}

        return ExamResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .title(entity.getTitle())
                .examType(entity.getExamType() != null ? entity.getExamType() : "SUBJECT")
                .blueprintId(entity.getBlueprintId())
                .subjectId(subjectId)
                .subjectName(subjectName)
                .subjectNames(new ArrayList<>(distinctSubjectNames))
                .courseId(primaryCourseId)
                .courseName(formattedCourseName)
                .courseIds(courseIds)
                .courseNames(courseNames)
                .courseCodes(courseCodes)
                .semester(entity.getSemester())
                .academicYear(entity.getAcademicYear())
                .unit(entity.getUnit())
                .examDate(entity.getExamDate() != null ? entity.getExamDate().toLocalDate().toString() : null)
                .durationMinutes(entity.getDurationMinutes())
                .examStructure(entity.getExamStructure())
                .numberOfTheories(entity.getNumberOfTheories())
                .numberOfPractices(entity.getNumberOfPractices())
                .numberOfEssays(entity.getNumberOfEssays())
                .numberOfSituations(entity.getNumberOfSituations())
                .numberOfExams(entity.getNumberOfExams())
                .examsPerBatch(examsPerBatch)
                .sections(sections)
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
