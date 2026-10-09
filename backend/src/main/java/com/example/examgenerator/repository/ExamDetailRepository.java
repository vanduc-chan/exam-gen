package com.example.examgenerator.repository;

import com.example.examgenerator.entity.ExamDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamDetailRepository extends JpaRepository<ExamDetail, UUID> {
    List<ExamDetail> findByExamId(UUID examId);
}
