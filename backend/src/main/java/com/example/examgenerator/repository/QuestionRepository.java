package com.example.examgenerator.repository;

import com.example.examgenerator.entity.Question;
import com.example.examgenerator.enumerate.DifficultyLevel;
import com.example.examgenerator.enumerate.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
    
    boolean existsByCode(String code);

    @Query("SELECT DISTINCT q FROM Question q LEFT JOIN q.courses c WHERE " +
           "(:subjectId IS NULL OR q.subject.id = :subjectId) AND " +
           "(:courseIds IS NULL OR c.id IN :courseIds) AND " +
           "(:type IS NULL OR q.type = :type) AND " +
           "(LOWER(q.content) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(q.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Question> findQuestionsWithFilters(
            @Param("subjectId") UUID subjectId,
            @Param("courseIds") java.util.List<UUID> courseIds,
            @Param("type") QuestionType type,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.subject.id = :subjectId AND q.type = :type AND q.isActive = true")
    long countActiveQuestionsBySubjectAndType(
            @Param("subjectId") UUID subjectId, 
            @Param("type") QuestionType type);
}
