package com.example.examgenerator.service;

import com.example.examgenerator.dto.request.QuestionRequest;
import com.example.examgenerator.dto.response.QuestionResponse;
import com.example.examgenerator.entity.Course;
import com.example.examgenerator.entity.Question;
import com.example.examgenerator.entity.Subject;
import com.example.examgenerator.enumerate.DifficultyLevel;
import com.example.examgenerator.enumerate.QuestionType;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.mapper.QuestionMapper;
import com.example.examgenerator.repository.CourseRepository;
import com.example.examgenerator.repository.QuestionRepository;
import com.example.examgenerator.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.io.InputStream;

import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final SubjectRepository subjectRepository;
    private final CourseRepository courseRepository;
    private final QuestionMapper questionMapper;
    private final QuestionSequenceService questionSequenceService;

    @Transactional(readOnly = true)
    public Page<QuestionResponse> getQuestions(UUID subjectId, UUID courseId, QuestionType type, DifficultyLevel level, String search, Pageable pageable) {
        String safeSearch = (search == null) ? "" : search;
        return questionRepository.findQuestionsWithFilters(subjectId, courseId, type, level, safeSearch, pageable)
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
        
        Question question = questionMapper.toEntity(request, subject);
        
        if (request.getCourseIds() != null && !request.getCourseIds().isEmpty()) {
            List<Course> courses = courseRepository.findAllById(request.getCourseIds());
            question.setCourses(new HashSet<>(courses));
        }

        // Auto gen code if missing: <Mã môn học>-<Số thứ tự câu hỏi>
        if (question.getCode() == null || question.getCode().trim().isEmpty()) {
            Long nextSeq = questionSequenceService.getNextSequenceValue(subject.getSubjectCode());
            question.setCode(subject.getSubjectCode() + "-" + nextSeq);
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
        
        questionMapper.updateEntityFromRequest(question, request, subject);
        
        if (request.getCourseIds() != null) {
            List<Course> courses = courseRepository.findAllById(request.getCourseIds());
            question.setCourses(new HashSet<>(courses));
        }

        question = questionRepository.save(question);
        return questionMapper.toResponse(question);
    }

    @Transactional
    public void deleteQuestions(List<UUID> ids) {
        try {
            questionRepository.deleteAllById(ids);
            questionRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Không thể xóa câu hỏi vì câu hỏi đã nằm trong đề thi/kỳ thi. Vui lòng kiểm tra lại!");
        }
    }

    @Transactional(readOnly = true)
    public long countActiveQuestions(UUID subjectId, QuestionType type) {
        return questionRepository.countActiveQuestionsBySubjectAndType(subjectId, type);
    }

    @Transactional
    public List<QuestionResponse> importQuestionsFromExcel(
            MultipartFile file, 
            UUID subjectId, 
            List<UUID> courseIds, 
            QuestionType type, 
            DifficultyLevel difficultyLevel, 
            Double score) {
        
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại với ID: " + subjectId));
        
        Set<Course> courses = new HashSet<>();
        if (courseIds != null && !courseIds.isEmpty()) {
            courses = new HashSet<>(courseRepository.findAllById(courseIds));
        }

        List<Question> questionsToSave = new ArrayList<>();
        DataFormatter dataFormatter = new DataFormatter();

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            boolean isFirstRow = true;

            for (Row row : sheet) {
                if (isFirstRow) {
                    isFirstRow = false;
                    continue; // Skip header
                }

                Cell questionCell = row.getCell(0, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                Cell answerCell = row.getCell(1, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);

                if (questionCell == null) {
                    continue; 
                }

                String content = dataFormatter.formatCellValue(questionCell).trim();
                if (content.isEmpty()) {
                    continue;
                }
                
                String answer = answerCell != null ? dataFormatter.formatCellValue(answerCell).trim() : "";

                Question question = new Question();
                question.setContent(content);
                question.setAnswer(answer);
                question.setType(type);
                question.setDifficultyLevel(difficultyLevel);
                question.setScore(score);
                question.setSubject(subject);
                question.setCourses(new HashSet<>(courses));
                question.setIsActive(true);
                
                Long nextSeq = questionSequenceService.getNextSequenceValue(subject.getSubjectCode());
                question.setCode(subject.getSubjectCode() + "-" + nextSeq);

                questionsToSave.add(question);
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi đọc file Excel: " + e.getMessage(), e);
        }

        List<Question> savedQuestions = questionRepository.saveAll(questionsToSave);
        return savedQuestions.stream().map(questionMapper::toResponse).collect(Collectors.toList());
    }
}
