package com.example.examgenerator.mapper;

import com.example.examgenerator.dto.request.SubjectRequest;
import com.example.examgenerator.dto.response.SubjectResponse;
import com.example.examgenerator.entity.DepartmentGroup;
import com.example.examgenerator.entity.Subject;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class SubjectMapper {

    public Subject toEntity(SubjectRequest request, DepartmentGroup departmentGroup) {
        if (request == null) {
            return null;
        }

        return Subject.builder()
                .subjectCode(request.getSubjectCode())
                .subjectName(request.getSubjectName())
                .description(request.getDescription())
                .departmentGroup(departmentGroup)
                .build();
    }

    public SubjectResponse toResponse(Subject entity) {
        if (entity == null) {
            return null;
        }

        UUID groupId = null;
        String groupName = null;
        try {
            if (entity.getDepartmentGroup() != null) {
                groupId = entity.getDepartmentGroup().getId();
                groupName = entity.getDepartmentGroup().getName();
            }
        } catch (Exception ignored) {}

        return SubjectResponse.builder()
                .id(entity.getId())
                .subjectCode(entity.getSubjectCode())
                .subjectName(entity.getSubjectName())
                .description(entity.getDescription())
                .departmentGroupId(groupId)
                .departmentGroupName(groupName)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public void updateEntityFromRequest(Subject entity, SubjectRequest request, DepartmentGroup departmentGroup) {
        if (request == null || entity == null) {
            return;
        }
        entity.setSubjectCode(request.getSubjectCode());
        entity.setSubjectName(request.getSubjectName());
        entity.setDescription(request.getDescription());
        entity.setDepartmentGroup(departmentGroup);
    }
}
