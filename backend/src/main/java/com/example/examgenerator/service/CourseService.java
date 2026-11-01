package com.example.examgenerator.service;

import com.example.examgenerator.dto.request.CourseRequest;
import com.example.examgenerator.dto.response.CourseResponse;
import com.example.examgenerator.entity.Course;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.mapper.CourseMapper;
import com.example.examgenerator.repository.CourseRepository;
import com.example.examgenerator.repository.ExamBlueprintRepository;
import com.example.examgenerator.repository.ExamRepository;
import com.example.examgenerator.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final ExamRepository examRepository;
    private final ExamBlueprintRepository examBlueprintRepository;
    private final QuestionRepository questionRepository;
    private final CourseMapper courseMapper;

    @Transactional(readOnly = true)
    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourseById(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đối tượng thi không tồn tại với ID: " + id));
        return courseMapper.toResponse(course);
    }

    @Transactional
    public CourseResponse createCourse(CourseRequest request) {
        if (courseRepository.existsByCourseCode(request.getCourseCode())) {
            throw new IllegalArgumentException("Mã đối tượng đã tồn tại: " + request.getCourseCode());
        }
        Course course = courseMapper.toEntity(request);
        course = courseRepository.save(course);
        return courseMapper.toResponse(course);
    }

    @Transactional
    public CourseResponse updateCourse(UUID id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đối tượng thi không tồn tại với ID: " + id));
        
        if (!course.getCourseCode().equals(request.getCourseCode()) && courseRepository.existsByCourseCode(request.getCourseCode())) {
            throw new IllegalArgumentException("Mã đối tượng đã tồn tại: " + request.getCourseCode());
        }

        courseMapper.updateEntityFromRequest(course, request);
        course = courseRepository.save(course);
        return courseMapper.toResponse(course);
    }

    @Transactional
    public void deleteCourse(UUID id) {
        if (!courseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Đối tượng thi không tồn tại với ID: " + id);
        }
        long examCount = examRepository.countByCourseId(id);
        if (examCount > 0) {
            throw new IllegalArgumentException("Không thể xóa Đối tượng dự thi này vì đang có " + examCount + " Đợt sinh đề sử dụng đối tượng này. Vui lòng xóa hoặc cập nhật Đợt sinh đề liên quan trước!");
        }
        long blueprintCount = examBlueprintRepository.countByCourseId(id);
        if (blueprintCount > 0) {
            throw new IllegalArgumentException("Không thể xóa Đối tượng dự thi này vì đang có " + blueprintCount + " Khung đề tốt nghiệp mẫu sử dụng đối tượng này. Vui lòng xóa hoặc cập nhật Khung đề mẫu liên quan trước!");
        }
        long questionCount = questionRepository.countByCourseId(id);
        if (questionCount > 0) {
            throw new IllegalArgumentException("Không thể xóa Đối tượng dự thi này vì đang có " + questionCount + " Câu hỏi gắn với đối tượng này. Vui lòng cập nhật hoặc xóa Câu hỏi liên quan trước!");
        }
        try {
            courseRepository.deleteById(id);
            courseRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Không thể xóa Đối tượng thi này vì đang có Đợt sinh đề hoặc Câu hỏi sử dụng. Vui lòng kiểm tra lại!");
        }
    }
}
