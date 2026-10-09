package com.example.examgenerator.mapper;

import com.example.examgenerator.dto.request.CourseRequest;
import com.example.examgenerator.dto.response.CourseResponse;
import com.example.examgenerator.entity.Course;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {

    public Course toEntity(CourseRequest request) {
        if (request == null) {
            return null;
        }

        return Course.builder()
                .courseCode(request.getCourseCode())
                .name(request.getName())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    public CourseResponse toResponse(Course entity) {
        if (entity == null) {
            return null;
        }

        return CourseResponse.builder()
                .id(entity.getId())
                .courseCode(entity.getCourseCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public void updateEntityFromRequest(Course entity, CourseRequest request) {
        if (request == null || entity == null) {
            return;
        }
        entity.setCourseCode(request.getCourseCode());
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
    }
}
