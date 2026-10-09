package com.example.examgenerator.mapper;

import com.example.examgenerator.dto.request.DepartmentGroupRequest;
import com.example.examgenerator.dto.response.DepartmentGroupResponse;
import com.example.examgenerator.entity.Department;
import com.example.examgenerator.entity.DepartmentGroup;
import org.springframework.stereotype.Component;

@Component
public class DepartmentGroupMapper {

    public DepartmentGroup toEntity(DepartmentGroupRequest request, Department department) {
        if (request == null) {
            return null;
        }

        return DepartmentGroup.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .department(department)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    public DepartmentGroupResponse toResponse(DepartmentGroup entity) {
        if (entity == null) {
            return null;
        }

        return DepartmentGroupResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .departmentId(entity.getDepartment() != null ? entity.getDepartment().getId() : null)
                .departmentName(entity.getDepartment() != null ? entity.getDepartment().getName() : null)
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public void updateEntityFromRequest(DepartmentGroup entity, DepartmentGroupRequest request, Department department) {
        if (request == null || entity == null) {
            return;
        }
        entity.setCode(request.getCode());
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setDepartment(department);
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
    }
}
