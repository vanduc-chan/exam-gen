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
@Table(name = "eg_exam_detail")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamDetail extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "exam_set_code", length = 50)
    private String examSetCode;

    @Column(name = "order_number")
    private int orderNumber;

    @Builder.Default
    @OneToMany(mappedBy = "examDetail", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamQuestion> questions = new ArrayList<>();
}
