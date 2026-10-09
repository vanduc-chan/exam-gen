package com.example.examgenerator.service;

import com.example.examgenerator.dto.request.QuestionRequest;
import com.example.examgenerator.dto.response.QuestionResponse;
import com.example.examgenerator.entity.Question;
import com.example.examgenerator.entity.QuestionCategory;
import com.example.examgenerator.entity.Subject;
import com.example.examgenerator.enumerate.DifficultyLevel;
import com.example.examgenerator.enumerate.QuestionType;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.mapper.QuestionMapper;
import com.example.examgenerator.repository.QuestionCategoryRepository;
import com.example.examgenerator.repository.QuestionRepository;
import com.example.examgenerator.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final SubjectRepository subjectRepository;
    private final QuestionCategoryRepository questionCategoryRepository;
    private final QuestionMapper questionMapper;

    @Transactional(readOnly = true)
    public Page<QuestionResponse> getQuestions(UUID subjectId, QuestionType type, DifficultyLevel level, String search, Pageable pageable) {
        String safeSearch = (search == null) ? "" : search;
        return questionRepository.findQuestionsWithFilters(subjectId, type, level, safeSearch, pageable)
                .map(questionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public QuestionResponse getQuestionById(UUID id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Câu hỏi không tồn tại với ID: " + id));
        return questionMapper.toResponse(question);
    }

    @Transactional
    public QuestionResponse createQuestion(QuestionRequest request) {
        if (request.getCode() != null && !request.getCode().isEmpty() && questionRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã câu hỏi đã tồn tại: " + request.getCode());
        }

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại với ID: " + request.getSubjectId()));
        
        QuestionCategory category = questionCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Phân loại câu hỏi không tồn tại với ID: " + request.getCategoryId()));

        Question question = questionMapper.toEntity(request, category, subject);
        
        // Auto gen code if missing
        if (question.getCode() == null || question.getCode().isEmpty()) {
            question.setCode("Q-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        question = questionRepository.save(question);
        return questionMapper.toResponse(question);
    }

    @Transactional
    public QuestionResponse updateQuestion(UUID id, QuestionRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Câu hỏi không tồn tại với ID: " + id));
        
        if (request.getCode() != null && !request.getCode().isEmpty() && !question.getCode().equals(request.getCode()) 
                && questionRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã câu hỏi đã tồn tại: " + request.getCode());
        }

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại với ID: " + request.getSubjectId()));
        
        QuestionCategory category = questionCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Phân loại câu hỏi không tồn tại với ID: " + request.getCategoryId()));

        questionMapper.updateEntityFromRequest(question, request, category, subject);
        question = questionRepository.save(question);
        return questionMapper.toResponse(question);
    }

    @Transactional
    public void deleteQuestions(List<UUID> ids) {
        questionRepository.deleteAllById(ids);
    }

    @Transactional(readOnly = true)
    public long countActiveQuestions(UUID subjectId, QuestionType type) {
        return questionRepository.countActiveQuestionsBySubjectAndType(subjectId, type);
    }
}
