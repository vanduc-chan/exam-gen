package com.example.examgenerator.repository;

import com.example.examgenerator.entity.QuestionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface QuestionCategoryRepository extends JpaRepository<QuestionCategory, UUID> {
    boolean existsByCode(String code);
}
