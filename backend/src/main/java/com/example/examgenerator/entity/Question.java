package com.example.examgenerator.entity;

import com.example.examgenerator.enumerate.DifficultyLevel;
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
@Table(name = "eg_question")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question extends BaseEntity {

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private Double score;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level")
    private DifficultyLevel difficultyLevel;

    @Column(name = "media_url")
    private String mediaUrl;

    @Column(unique = true, length = 100)
    private String code;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Builder.Default
    @jakarta.persistence.ManyToMany(fetch = FetchType.LAZY)
    @jakarta.persistence.JoinTable(
        name = "eg_question_course",
        joinColumns = @jakarta.persistence.JoinColumn(name = "question_id"),
        inverseJoinColumns = @jakarta.persistence.JoinColumn(name = "course_id")
    )
    private java.util.Set<Course> courses = new java.util.HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
