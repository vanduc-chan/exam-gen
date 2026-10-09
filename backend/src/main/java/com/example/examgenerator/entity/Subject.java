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
@Table(name = "eg_subject")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subject extends BaseEntity {

    @Column(name = "subject_code", nullable = false, unique = true, length = 50)
    private String subjectCode;

    @Column(name = "subject_name", nullable = false)
    private String subjectName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_group_id")
    private DepartmentGroup departmentGroup;

    @Builder.Default
    @OneToMany(mappedBy = "subject", cascade = CascadeType.ALL)
    private List<Question> questions = new ArrayList<>();
}
