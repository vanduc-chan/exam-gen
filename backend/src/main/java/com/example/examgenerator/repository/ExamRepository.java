package com.example.examgenerator.repository;

import com.example.examgenerator.entity.Exam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ExamRepository extends JpaRepository<Exam, UUID> {
    
    @Query("SELECT DISTINCT e FROM Exam e LEFT JOIN e.courses c WHERE " +
           "(:subjectId IS NULL OR e.subject.id = :subjectId) AND " +
           "(:courseId IS NULL OR e.course.id = :courseId OR c.id = :courseId) AND " +
           "(LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Exam> findExamsWithFilters(
            @Param("subjectId") UUID subjectId,
            @Param("courseId") UUID courseId,
            @Param("search") String search,
            Pageable pageable);

    boolean existsByCode(String code);
}
