package com.example.examgenerator.service;

import com.example.examgenerator.dto.request.ExamRequest;
import com.example.examgenerator.dto.response.ExamResponse;
import com.example.examgenerator.entity.Course;
import com.example.examgenerator.entity.Exam;
import com.example.examgenerator.entity.ExamDetail;
import com.example.examgenerator.entity.ExamQuestion;
import com.example.examgenerator.entity.Question;
import com.example.examgenerator.entity.Subject;
import com.example.examgenerator.enumerate.ExamStructureType;
import com.example.examgenerator.enumerate.QuestionType;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.mapper.ExamMapper;
import com.example.examgenerator.repository.CourseRepository;
import com.example.examgenerator.repository.ExamDetailRepository;
import com.example.examgenerator.repository.ExamQuestionRepository;
import com.example.examgenerator.repository.ExamRepository;
import com.example.examgenerator.repository.QuestionRepository;
import com.example.examgenerator.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamGeneratorService {

    private final ExamRepository examRepository;
    private final ExamDetailRepository examDetailRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final SubjectRepository subjectRepository;
    private final CourseRepository courseRepository;
    private final QuestionRepository questionRepository;
    private final ExamMapper examMapper;

    @Transactional(readOnly = true)
    public Page<ExamResponse> getExams(UUID subjectId, UUID courseId, String search, Pageable pageable) {
        String safeSearch = (search == null) ? "" : search;
        return examRepository.findExamsWithFilters(subjectId, courseId, safeSearch, pageable)
                .map(examMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ExamResponse getExamById(UUID id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tồn tại với ID: " + id));
        return examMapper.toResponse(exam);
    }

    @Transactional
    public ExamResponse generateExam(ExamRequest request) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại"));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Đối tượng thi không tồn tại"));

        // Load all active questions for the subject
        List<Question> allQuestions = questionRepository.findAll().stream()
                .filter(q -> q.getSubject().getId().equals(subject.getId()) && Boolean.TRUE.equals(q.getIsActive()))
                .collect(Collectors.toList());

        List<Question> theories = filterByType(allQuestions, QuestionType.LY_THUYET);
        List<Question> practices = filterByType(allQuestions, QuestionType.THUC_HANH);
        List<Question> essays = filterByType(allQuestions, QuestionType.TU_LUAN);
        List<Question> situations = filterByType(allQuestions, QuestionType.TINH_HUONG);

        // Validate enough questions
        validateQuestionCount(request.getExamStructure(), request.getNumberOfExams(), theories.size(), practices.size(), essays.size(), situations.size());

        // Create Master Exam record
        Exam exam = examMapper.toEntity(request, subject, course);
        exam.setCode("EX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        exam = examRepository.save(exam);

        Set<Set<UUID>> generatedSets = new HashSet<>();

        // Generate N details
        for (int i = 0; i < request.getNumberOfExams(); i++) {
            List<Question> selectedQuestions = generateUniqueSet(request.getExamStructure(), theories, practices, essays, situations, generatedSets);
            
            ExamDetail detail = ExamDetail.builder()
                    .examSetCode(exam.getCode() + "-" + String.format("%02d", i + 1))
                    .exam(exam)
                    .build();
            detail = examDetailRepository.save(detail);

            int order = 1;
            for (Question q : selectedQuestions) {
                ExamQuestion eq = ExamQuestion.builder()
                        .examDetail(detail)
                        .question(q)
                        .questionOrder(order++)
                        .score(q.getScore())
                        .build();
                examQuestionRepository.save(eq);
            }
        }

        return examMapper.toResponse(exam);
    }

    @Transactional
    public void deleteExam(UUID id) {
        examRepository.deleteById(id);
    }

    private List<Question> filterByType(List<Question> list, QuestionType type) {
        return list.stream().filter(q -> q.getType() == type).collect(Collectors.toList());
    }

    private void validateQuestionCount(ExamStructureType structure, int numExams, int t, int p, int e, int s) {
        // We ideally want at least one unique combination for each exam to avoid duplicates.
        // For simplicity, we just check if we have at least 1 question of required types.
        if (structure == ExamStructureType.THEORY_PRACTICE && (t < 1 || p < 1)) {
            throw new IllegalArgumentException("Không đủ câu hỏi Lý thuyết hoặc Thực hành để sinh đề.");
        }
        if (structure == ExamStructureType.ESSAY && e < 1) {
            throw new IllegalArgumentException("Không đủ câu hỏi Tự luận để sinh đề.");
        }
        if (structure == ExamStructureType.THEORY_PRACTICE_SITUATION && (t < 1 || p < 1 || s < 1)) {
            throw new IllegalArgumentException("Không đủ câu hỏi Lý thuyết, Thực hành hoặc Tình huống để sinh đề.");
        }
    }

    private List<Question> generateUniqueSet(
            ExamStructureType structure, 
            List<Question> tList, 
            List<Question> pList, 
            List<Question> eList, 
            List<Question> sList,
            Set<Set<UUID>> generatedSets) {
        
        int maxAttempts = 100;
        
        for (int i = 0; i < maxAttempts; i++) {
            List<Question> candidate = new ArrayList<>();
            
            if (structure == ExamStructureType.THEORY_PRACTICE) {
                candidate.add(getRandom(tList));
                candidate.add(getRandom(pList));
            } else if (structure == ExamStructureType.ESSAY) {
                candidate.add(getRandom(eList));
            } else if (structure == ExamStructureType.THEORY_PRACTICE_SITUATION) {
                candidate.add(getRandom(tList));
                candidate.add(getRandom(pList));
                candidate.add(getRandom(sList));
            }
            
            Set<UUID> idSet = candidate.stream().map(Question::getId).collect(Collectors.toSet());
            if (!generatedSets.contains(idSet)) {
                generatedSets.add(idSet);
                return candidate;
            }
        }
        
        // Fallback if we run out of unique combinations
        List<Question> fallback = new ArrayList<>();
        if (structure == ExamStructureType.THEORY_PRACTICE) {
            fallback.add(getRandom(tList));
            fallback.add(getRandom(pList));
        } else if (structure == ExamStructureType.ESSAY) {
            fallback.add(getRandom(eList));
        } else if (structure == ExamStructureType.THEORY_PRACTICE_SITUATION) {
            fallback.add(getRandom(tList));
            fallback.add(getRandom(pList));
            fallback.add(getRandom(sList));
        }
        return fallback;
    }

    private Question getRandom(List<Question> list) {
        if (list.isEmpty()) return null;
        List<Question> copy = new ArrayList<>(list);
        Collections.shuffle(copy);
        return copy.get(0);
    }
}
