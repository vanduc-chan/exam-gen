package com.example.examgenerator.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "eg_department_group")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentGroup extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Builder.Default
    @OneToMany(mappedBy = "departmentGroup", cascade = CascadeType.ALL)
    private List<Subject> subjects = new ArrayList<>();

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
