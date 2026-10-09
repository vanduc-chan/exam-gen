package com.example.examgenerator.service;

import com.example.examgenerator.repository.CourseRepository;
import com.example.examgenerator.repository.DepartmentGroupRepository;
import com.example.examgenerator.repository.DepartmentRepository;
import com.example.examgenerator.repository.ExamRepository;
import com.example.examgenerator.repository.QuestionRepository;
import com.example.examgenerator.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentGroupRepository departmentGroupRepository;
    private final SubjectRepository subjectRepository;
    private final CourseRepository courseRepository;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;

    @Transactional(readOnly = true)
    public Map<String, Long> getStatistics() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("departments", departmentRepository.count());
        stats.put("departmentGroups", departmentGroupRepository.count());
        stats.put("subjects", subjectRepository.count());
        stats.put("courses", courseRepository.count());
        stats.put("questions", questionRepository.count());
        stats.put("exams", examRepository.count());
        return stats;
    }
}
