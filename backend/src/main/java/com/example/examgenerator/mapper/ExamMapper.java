package com.example.examgenerator.mapper;

import com.example.examgenerator.dto.request.ExamRequest;
import com.example.examgenerator.dto.response.ExamResponse;
import com.example.examgenerator.entity.Course;
import com.example.examgenerator.entity.Exam;
import com.example.examgenerator.entity.Subject;
import com.example.examgenerator.enumerate.ExamStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ExamMapper {

    public Exam toEntity(ExamRequest request, Subject subject, Course course) {
        if (request == null) {
            return null;
        }

        return Exam.builder()
                .title(request.getTitle())
                .subject(subject)
                .course(course)
                .semester(request.getSemester())
                .academicYear(request.getAcademicYear())
                .durationMinutes(request.getDurationMinutes())
                .examStructure(request.getExamStructure())
                .numberOfExams(request.getNumberOfExams())
                .status(ExamStatus.GENERATED)
                .build();
    }

    public ExamResponse toResponse(Exam entity) {
        if (entity == null) {
            return null;
        }

        return ExamResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .title(entity.getTitle())
                .subjectId(entity.getSubject() != null ? entity.getSubject().getId() : null)
                .subjectName(entity.getSubject() != null ? entity.getSubject().getSubjectName() : null)
                .courseId(entity.getCourse() != null ? entity.getCourse().getId() : null)
                .courseName(entity.getCourse() != null ? entity.getCourse().getName() : null)
                .semester(entity.getSemester())
                .academicYear(entity.getAcademicYear())
                .durationMinutes(entity.getDurationMinutes())
                .examStructure(entity.getExamStructure())
                .numberOfExams(entity.getNumberOfExams())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
