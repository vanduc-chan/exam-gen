package com.example.examgenerator.repository;

import com.example.examgenerator.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {
    boolean existsByCourseCode(String courseCode);
}
