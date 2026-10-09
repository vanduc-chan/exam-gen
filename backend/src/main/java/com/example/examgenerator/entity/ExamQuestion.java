package com.example.examgenerator.entity;

import com.example.examgenerator.enumerate.QuestionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "eg_exam_question")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestion extends BaseEntity {

    @Column(name = "section_order")
    private int questionOrder;

    @Column
    private Double score;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type")
    private QuestionType questionType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_detail_id", nullable = false)
    private ExamDetail examDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
}
