package com.example.examgenerator.mapper;

import com.example.examgenerator.dto.request.DepartmentRequest;
import com.example.examgenerator.dto.response.DepartmentResponse;
import com.example.examgenerator.entity.Department;
import org.springframework.stereotype.Component;

@Component
public class DepartmentMapper {

    public Department toEntity(DepartmentRequest request) {
        if (request == null) {
            return null;
        }

        return Department.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    public DepartmentResponse toResponse(Department entity) {
        if (entity == null) {
            return null;
        }

        return DepartmentResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public void updateEntityFromRequest(Department entity, DepartmentRequest request) {
        if (request == null || entity == null) {
            return;
        }
        entity.setCode(request.getCode());
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
    }
}
