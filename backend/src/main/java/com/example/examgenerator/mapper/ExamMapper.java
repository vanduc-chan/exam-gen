package com.example.examgenerator.mapper;

import com.example.examgenerator.dto.request.ExamRequest;
import com.example.examgenerator.dto.response.ExamResponse;
import com.example.examgenerator.entity.Course;
import com.example.examgenerator.entity.Exam;
import com.example.examgenerator.entity.Subject;
import com.example.examgenerator.enumerate.ExamStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ExamMapper {

    public Exam toEntity(ExamRequest request, Subject subject, Course course) {
        Set<Course> courses = course != null ? Collections.singleton(course) : Collections.emptySet();
        return toEntity(request, subject, courses);
    }

    public Exam toEntity(ExamRequest request, Subject subject, Set<Course> courses) {
        if (request == null) {
            return null;
        }

        Course primaryCourse = (courses != null && !courses.isEmpty()) ? courses.iterator().next() : null;

        return Exam.builder()
                .title(request.getTitle())
                .subject(subject)
                .course(primaryCourse)
                .courses(courses != null ? courses : Collections.emptySet())
                .semester(request.getSemester())
                .academicYear(request.getAcademicYear())
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

        UUID primaryCourseId = !courseIds.isEmpty() ? courseIds.get(0) : (entity.getCourse() != null ? entity.getCourse().getId() : null);
        String formattedCourseName = !courseNames.isEmpty() ? String.join(", ", courseNames) : (entity.getCourse() != null ? entity.getCourse().getName() : null);

        return ExamResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .title(entity.getTitle())
                .subjectId(entity.getSubject() != null ? entity.getSubject().getId() : null)
                .subjectName(entity.getSubject() != null ? entity.getSubject().getSubjectName() : null)
                .courseId(primaryCourseId)
                .courseName(formattedCourseName)
                .courseIds(courseIds)
                .courseNames(courseNames)
                .courseCodes(courseCodes)
                .semester(entity.getSemester())
                .academicYear(entity.getAcademicYear())
                .durationMinutes(entity.getDurationMinutes())
                .examStructure(entity.getExamStructure())
                .numberOfTheories(entity.getNumberOfTheories())
                .numberOfPractices(entity.getNumberOfPractices())
                .numberOfEssays(entity.getNumberOfEssays())
                .numberOfSituations(entity.getNumberOfSituations())
                .numberOfExams(entity.getNumberOfExams())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
