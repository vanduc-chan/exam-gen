package com.example.examgenerator.controller;

import com.example.examgenerator.dto.request.DepartmentGroupRequest;
import com.example.examgenerator.dto.response.ApiResponse;
import com.example.examgenerator.dto.response.DepartmentGroupResponse;
import com.example.examgenerator.service.DepartmentGroupService;
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
@RequestMapping("/api/department-groups")
@RequiredArgsConstructor
public class DepartmentGroupController {

    private final DepartmentGroupService departmentGroupService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DepartmentGroupResponse>>> getAllDepartmentGroups(
            @RequestParam(required = false) UUID departmentId) {
        return ResponseEntity.ok(ApiResponse.success(departmentGroupService.getAllDepartmentGroups(departmentId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentGroupResponse>> getDepartmentGroupById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(departmentGroupService.getDepartmentGroupById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DepartmentGroupResponse>> createDepartmentGroup(@Valid @RequestBody DepartmentGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Thêm tổ bộ môn thành công", departmentGroupService.createDepartmentGroup(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentGroupResponse>> updateDepartmentGroup(
            @PathVariable UUID id, 
            @Valid @RequestBody DepartmentGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tổ bộ môn thành công", departmentGroupService.updateDepartmentGroup(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDepartmentGroup(@PathVariable UUID id) {
        departmentGroupService.deleteDepartmentGroup(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa tổ bộ môn thành công", null));
    }
}
