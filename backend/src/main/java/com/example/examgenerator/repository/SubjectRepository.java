package com.example.examgenerator.repository;

import com.example.examgenerator.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, UUID> {
    boolean existsBySubjectCode(String subjectCode);
    List<Subject> findByDepartmentGroupId(UUID departmentGroupId);
    boolean existsByDepartmentGroupId(UUID departmentGroupId);
    long countByDepartmentGroupId(UUID departmentGroupId);

    Optional<Subject> findBySubjectCode(String subjectCode);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Subject s LEFT JOIN FETCH s.departmentGroup dg LEFT JOIN FETCH dg.department WHERE s.id = :id")
    Optional<Subject> findByIdWithDepartment(@org.springframework.data.repository.query.Param("id") UUID id);
}
