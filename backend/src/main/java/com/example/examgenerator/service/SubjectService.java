package com.example.examgenerator.service;

import com.example.examgenerator.dto.request.SubjectRequest;
import com.example.examgenerator.dto.response.SubjectResponse;
import com.example.examgenerator.entity.DepartmentGroup;
import com.example.examgenerator.entity.Subject;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.mapper.SubjectMapper;
import com.example.examgenerator.repository.DepartmentGroupRepository;
import com.example.examgenerator.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final DepartmentGroupRepository departmentGroupRepository;
    private final SubjectMapper subjectMapper;

    @Transactional(readOnly = true)
    public List<SubjectResponse> getAllSubjects(UUID departmentGroupId) {
        List<Subject> subjects = departmentGroupId != null 
                ? subjectRepository.findByDepartmentGroupId(departmentGroupId)
                : subjectRepository.findAll();
                
        return subjects.stream()
                .map(subjectMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubjectResponse getSubjectById(UUID id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại với ID: " + id));
        return subjectMapper.toResponse(subject);
    }

    @Transactional
    public SubjectResponse createSubject(SubjectRequest request) {
        if (subjectRepository.existsBySubjectCode(request.getSubjectCode())) {
            throw new IllegalArgumentException("Mã môn học đã tồn tại: " + request.getSubjectCode());
        }

        DepartmentGroup group = null;
        if (request.getDepartmentGroupId() != null) {
            group = departmentGroupRepository.findById(request.getDepartmentGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tổ bộ môn không tồn tại với ID: " + request.getDepartmentGroupId()));
        }

        Subject subject = subjectMapper.toEntity(request, group);
        subject = subjectRepository.save(subject);
        return subjectMapper.toResponse(subject);
    }

    @Transactional
    public SubjectResponse updateSubject(UUID id, SubjectRequest request) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại với ID: " + id));
        
        if (!subject.getSubjectCode().equals(request.getSubjectCode()) && subjectRepository.existsBySubjectCode(request.getSubjectCode())) {
            throw new IllegalArgumentException("Mã môn học đã tồn tại: " + request.getSubjectCode());
        }

        DepartmentGroup group = null;
        if (request.getDepartmentGroupId() != null) {
            group = departmentGroupRepository.findById(request.getDepartmentGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tổ bộ môn không tồn tại với ID: " + request.getDepartmentGroupId()));
        }

        subjectMapper.updateEntityFromRequest(subject, request, group);
        subject = subjectRepository.save(subject);
        return subjectMapper.toResponse(subject);
    }

    @Transactional
    public void deleteSubject(UUID id) {
        if (!subjectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Môn học không tồn tại với ID: " + id);
        }
        subjectRepository.deleteById(id);
    }
}
