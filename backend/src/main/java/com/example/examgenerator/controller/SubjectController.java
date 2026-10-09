package com.example.examgenerator.controller;

import com.example.examgenerator.dto.request.SubjectRequest;
import com.example.examgenerator.dto.response.ApiResponse;
import com.example.examgenerator.dto.response.SubjectResponse;
import com.example.examgenerator.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getAllSubjects(
            @RequestParam(required = false) UUID departmentGroupId) {
        return ResponseEntity.ok(ApiResponse.success(subjectService.getAllSubjects(departmentGroupId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubjectResponse>> getSubjectById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(subjectService.getSubjectById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SubjectResponse>> createSubject(@Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Thêm môn học thành công", subjectService.createSubject(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SubjectResponse>> updateSubject(
            @PathVariable UUID id, 
            @Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật môn học thành công", subjectService.updateSubject(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSubject(@PathVariable UUID id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa môn học thành công", null));
    }
}
