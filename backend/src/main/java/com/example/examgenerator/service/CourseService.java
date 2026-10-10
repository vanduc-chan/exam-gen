package com.example.examgenerator.service;

import com.example.examgenerator.dto.request.CourseRequest;
import com.example.examgenerator.dto.response.CourseResponse;
import com.example.examgenerator.entity.Course;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.mapper.CourseMapper;
import com.example.examgenerator.repository.CourseRepository;
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
        try {
            courseRepository.deleteById(id);
            courseRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Không thể xóa Đối tượng thi này vì đang có Đợt sinh đề sử dụng. Vui lòng kiểm tra lại!");
        }
    }
}
