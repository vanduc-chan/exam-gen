package com.example.examgenerator.config;

import com.example.examgenerator.entity.QuestionCategory;
import com.example.examgenerator.repository.QuestionCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final QuestionCategoryRepository questionCategoryRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedQuestionCategories();
    }

    private void seedQuestionCategories() {
        if (questionCategoryRepository.count() == 0) {
            questionCategoryRepository.save(QuestionCategory.builder().code("LY_THUYET").name("Lý thuyết").build());
            questionCategoryRepository.save(QuestionCategory.builder().code("THUC_HANH").name("Thực hành").build());
            questionCategoryRepository.save(QuestionCategory.builder().code("TU_LUAN").name("Tự luận").build());
            questionCategoryRepository.save(QuestionCategory.builder().code("TINH_HUONG").name("Tình huống").build());
            System.out.println("Seeded question categories");
        }
    }
}
