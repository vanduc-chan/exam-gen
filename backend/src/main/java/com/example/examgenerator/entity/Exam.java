package com.example.examgenerator.entity;

import com.example.examgenerator.enumerate.ExamStatus;
import com.example.examgenerator.enumerate.ExamStructureType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "eg_exam")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Exam extends BaseEntity {

    @Column(unique = true, length = 100)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_exam_sets")
    private int numberOfExams;

    private int durationMinutes;

    @Column(length = 50)
    private String semester;

    @Column(name = "academic_year", length = 50)
    private String academicYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "structure_type", nullable = false)
    private ExamStructureType examStructure;

    @Column(name = "number_of_theories")
    private Integer numberOfTheories;

    @Column(name = "number_of_practices")
    private Integer numberOfPractices;

    @Column(name = "number_of_essays")
    private Integer numberOfEssays;

    @Column(name = "number_of_situations")
    private Integer numberOfSituations;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamStatus status = ExamStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(name = "exam_date")
    private LocalDateTime examDate;

    @Builder.Default
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamDetail> examDetails = new ArrayList<>();
}
