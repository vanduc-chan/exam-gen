package com.example.examgenerator.service;

import com.example.examgenerator.dto.request.DepartmentRequest;
import com.example.examgenerator.dto.response.DepartmentResponse;
import com.example.examgenerator.entity.Department;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.mapper.DepartmentMapper;
import com.example.examgenerator.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentMapper departmentMapper;

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(departmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khoa không tồn tại với ID: " + id));
        return departmentMapper.toResponse(department);
    }

    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã khoa đã tồn tại: " + request.getCode());
        }
        Department department = departmentMapper.toEntity(request);
        department = departmentRepository.save(department);
        return departmentMapper.toResponse(department);
    }

    @Transactional
    public DepartmentResponse updateDepartment(UUID id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khoa không tồn tại với ID: " + id));
        
        if (!department.getCode().equals(request.getCode()) && departmentRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã khoa đã tồn tại: " + request.getCode());
        }

        departmentMapper.updateEntityFromRequest(department, request);
        department = departmentRepository.save(department);
        return departmentMapper.toResponse(department);
    }

    @Transactional
    public void deleteDepartment(UUID id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Khoa không tồn tại với ID: " + id);
        }
        departmentRepository.deleteById(id);
    }
}
