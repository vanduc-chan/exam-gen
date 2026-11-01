package com.example.examgenerator.repository;

import com.example.examgenerator.entity.ExamBlueprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamBlueprintRepository extends JpaRepository<ExamBlueprint, UUID> {

    @Query("SELECT DISTINCT b FROM ExamBlueprint b LEFT JOIN b.courses c WHERE " +
           "(:courseId IS NULL OR c.id = :courseId) ORDER BY b.createdAt DESC")
    List<ExamBlueprint> findByCourseFilter(@Param("courseId") UUID courseId);

    @Query("SELECT COUNT(DISTINCT b) FROM ExamBlueprint b JOIN b.courses c WHERE c.id = :courseId")
    long countByCourseId(@Param("courseId") UUID courseId);
}

