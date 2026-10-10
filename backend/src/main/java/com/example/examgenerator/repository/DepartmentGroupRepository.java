package com.example.examgenerator.repository;

import com.example.examgenerator.entity.DepartmentGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentGroupRepository extends JpaRepository<DepartmentGroup, UUID> {
    boolean existsByCode(String code);
    List<DepartmentGroup> findByDepartmentId(UUID departmentId);

    Optional<DepartmentGroup> findByCode(String groupCode);
}
