package com.example.examgenerator.controller;

import com.example.examgenerator.dto.response.ApiResponse;
import com.example.examgenerator.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatistics() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStatistics()));
    }
}
