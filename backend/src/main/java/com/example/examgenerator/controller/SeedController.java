package com.example.examgenerator.controller;

import com.example.examgenerator.config.DataInitializer;
import com.example.examgenerator.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/seed")
@RequiredArgsConstructor
public class SeedController {

    private final DataInitializer dataInitializer;
    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final CourseRepository courseRepository;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;

    @PostMapping("/init")
    public ResponseEntity<Map<String, Object>> seedData() {
        dataInitializer.seedData();
        return ResponseEntity.ok(getStatusMap("Dữ liệu mẫu đã được khởi tạo thành công!"));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(getStatusMap("Thống kê dữ liệu hiện tại"));
    }

    private Map<String, Object> getStatusMap(String message) {
        Map<String, Object> map = new HashMap<>();
        map.put("message", message);
        map.put("departments", departmentRepository.count());
        map.put("subjects", subjectRepository.count());
        map.put("courses", courseRepository.count());
        map.put("questions", questionRepository.count());
        map.put("exams", examRepository.count());
        return map;
    }
}
