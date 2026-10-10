package com.example.examgenerator.repository;

import com.example.examgenerator.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    boolean existsByCode(String code);

    Optional<Department> findByCode(String deptCode);
}
