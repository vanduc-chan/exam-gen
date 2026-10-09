package com.example.examgenerator.service;

import com.example.examgenerator.dto.request.DepartmentGroupRequest;
import com.example.examgenerator.dto.response.DepartmentGroupResponse;
import com.example.examgenerator.entity.Department;
import com.example.examgenerator.entity.DepartmentGroup;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.mapper.DepartmentGroupMapper;
import com.example.examgenerator.repository.DepartmentGroupRepository;
import com.example.examgenerator.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentGroupService {

    private final DepartmentGroupRepository departmentGroupRepository;
    private final DepartmentRepository departmentRepository;
    private final DepartmentGroupMapper departmentGroupMapper;

    @Transactional(readOnly = true)
    public List<DepartmentGroupResponse> getAllDepartmentGroups(UUID departmentId) {
        List<DepartmentGroup> groups = departmentId != null 
                ? departmentGroupRepository.findByDepartmentId(departmentId)
                : departmentGroupRepository.findAll();
                
        return groups.stream()
                .map(departmentGroupMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentGroupResponse getDepartmentGroupById(UUID id) {
        DepartmentGroup group = departmentGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tổ bộ môn không tồn tại với ID: " + id));
        return departmentGroupMapper.toResponse(group);
    }

    @Transactional
    public DepartmentGroupResponse createDepartmentGroup(DepartmentGroupRequest request) {
        if (departmentGroupRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã tổ bộ môn đã tồn tại: " + request.getCode());
        }
        
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Khoa không tồn tại với ID: " + request.getDepartmentId()));

        DepartmentGroup group = departmentGroupMapper.toEntity(request, department);
        group = departmentGroupRepository.save(group);
        return departmentGroupMapper.toResponse(group);
    }

    @Transactional
    public DepartmentGroupResponse updateDepartmentGroup(UUID id, DepartmentGroupRequest request) {
        DepartmentGroup group = departmentGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tổ bộ môn không tồn tại với ID: " + id));
        
        if (!group.getCode().equals(request.getCode()) && departmentGroupRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã tổ bộ môn đã tồn tại: " + request.getCode());
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Khoa không tồn tại với ID: " + request.getDepartmentId()));

        departmentGroupMapper.updateEntityFromRequest(group, request, department);
        group = departmentGroupRepository.save(group);
        return departmentGroupMapper.toResponse(group);
    }

    @Transactional
    public void deleteDepartmentGroup(UUID id) {
        if (!departmentGroupRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tổ bộ môn không tồn tại với ID: " + id);
        }
        departmentGroupRepository.deleteById(id);
    }
}
