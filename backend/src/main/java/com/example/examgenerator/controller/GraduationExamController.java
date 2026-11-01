package com.example.examgenerator.controller;

import com.example.examgenerator.dto.request.BatchSubjectAvailabilityRequest;
import com.example.examgenerator.dto.request.ExamBlueprintRequest;
import com.example.examgenerator.dto.request.GraduationExamRequest;
import com.example.examgenerator.dto.request.SlotAvailabilityRequest;
import com.example.examgenerator.dto.response.ApiResponse;
import com.example.examgenerator.dto.response.ExamBlueprintResponse;
import com.example.examgenerator.dto.response.ExamResponse;
import com.example.examgenerator.dto.response.SlotAvailabilityResponse;
import com.example.examgenerator.dto.response.SubjectAvailabilityItemResponse;
import com.example.examgenerator.service.GraduationExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GraduationExamController {

    private final GraduationExamService graduationExamService;

    // ==========================================
    // GRADUATION EXAMS ENDPOINTS
    // ==========================================

    @GetMapping("/graduation-exams")
    public ResponseEntity<ApiResponse<Page<ExamResponse>>> getGraduationExams(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) UUID courseId,
            @RequestParam(required = false) String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.success(
                graduationExamService.getGraduationExams(courseId, search, pageable)
        ));
    }

    @GetMapping("/graduation-exams/{id}")
    public ResponseEntity<ApiResponse<ExamResponse>> getGraduationExamById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(graduationExamService.getGraduationExamById(id)));
    }

    @PostMapping("/graduation-exams/generate")
    public ResponseEntity<ApiResponse<ExamResponse>> generateGraduationExam(
            @Valid @RequestBody GraduationExamRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Sinh đề thi tốt nghiệp thành công",
                graduationExamService.generateGraduationExam(request)
        ));
    }

    @PutMapping("/graduation-exams/{id}")
    public ResponseEntity<ApiResponse<ExamResponse>> updateGraduationExam(
            @PathVariable UUID id,
            @Valid @RequestBody GraduationExamRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật đề thi tốt nghiệp thành công",
                graduationExamService.updateGraduationExam(id, request)
        ));
    }

    @DeleteMapping("/graduation-exams/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGraduationExam(@PathVariable UUID id) {
        graduationExamService.deleteGraduationExam(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa đề thi tốt nghiệp thành công", null));
    }

    @PostMapping("/graduation-exams/check-availability")
    public ResponseEntity<ApiResponse<SlotAvailabilityResponse>> checkSlotAvailability(
            @RequestBody SlotAvailabilityRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                graduationExamService.checkSlotAvailability(request)
        ));
    }

    @PostMapping("/graduation-exams/check-availability-batch")
    public ResponseEntity<ApiResponse<Map<UUID, SubjectAvailabilityItemResponse>>> checkBatchSubjectAvailability(
            @RequestBody BatchSubjectAvailabilityRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                graduationExamService.checkBatchSubjectAvailability(request)
        ));
    }

    // ==========================================
    // EXAM BLUEPRINT TEMPLATES ("KHUNG ĐỀ MẪU")
    // ==========================================

    @GetMapping("/exam-blueprints")
    public ResponseEntity<ApiResponse<List<ExamBlueprintResponse>>> getAllBlueprints(
            @RequestParam(required = false) UUID courseId) {
        return ResponseEntity.ok(ApiResponse.success(graduationExamService.getAllBlueprints(courseId)));
    }

    @GetMapping("/exam-blueprints/{id}")
    public ResponseEntity<ApiResponse<ExamBlueprintResponse>> getBlueprintById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(graduationExamService.getBlueprintById(id)));
    }

    @PostMapping("/exam-blueprints")
    public ResponseEntity<ApiResponse<ExamBlueprintResponse>> createBlueprint(
            @Valid @RequestBody ExamBlueprintRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lưu khung đề mẫu thành công",
                graduationExamService.createBlueprint(request)
        ));
    }

    @PutMapping("/exam-blueprints/{id}")
    public ResponseEntity<ApiResponse<ExamBlueprintResponse>> updateBlueprint(
            @PathVariable UUID id,
            @Valid @RequestBody ExamBlueprintRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật khung đề mẫu thành công",
                graduationExamService.updateBlueprint(id, request)
        ));
    }

    @DeleteMapping("/exam-blueprints/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBlueprint(@PathVariable UUID id) {
        graduationExamService.deleteBlueprint(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa khung đề mẫu thành công", null));
    }
}

