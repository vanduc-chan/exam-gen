package com.example.examgenerator.repository;

import com.example.examgenerator.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, UUID> {
    boolean existsBySubjectCode(String subjectCode);
    List<Subject> findByDepartmentGroupId(UUID departmentGroupId);
}
