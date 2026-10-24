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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

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

    private Set<Course> resolveCourses(ExamRequest request) {
        List<UUID> courseIds = request.getCourseIds();
        if (courseIds == null || courseIds.isEmpty()) {
            if (request.getCourseId() != null) {
                courseIds = List.of(request.getCourseId());
            }
        }
        if (courseIds == null || courseIds.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một đối tượng thi");
        }
        List<Course> coursesList = courseRepository.findAllById(courseIds);
        if (coursesList.isEmpty()) {
            throw new ResourceNotFoundException("Đối tượng thi không tồn tại");
        }
        return new HashSet<>(coursesList);
    }

    private String resolveCourseCode(Set<Course> courses) {
        if (courses == null || courses.isEmpty()) return "DTT";
        return courses.stream()
                .map(Course::getCourseCode)
                .filter(java.util.Objects::nonNull)
                .sorted()
                .collect(Collectors.joining("-"));
    }

    @Transactional
    public ExamResponse generateExam(ExamRequest request) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại"));
        Set<Course> courses = resolveCourses(request);
        Set<UUID> courseIdSet = courses.stream().map(Course::getId).collect(Collectors.toSet());

        int[] counts = resolveQuestionCounts(request);
        int numT = counts[0], numP = counts[1], numE = counts[2], numS = counts[3];

        request.setNumberOfTheories(numT);
        request.setNumberOfPractices(numP);
        request.setNumberOfEssays(numE);
        request.setNumberOfSituations(numS);
        if (request.getExamStructure() == null) {
            request.setExamStructure(ExamStructureType.CUSTOM);
        }

        // Load all active questions for the subject and any of the selected courses
        List<Question> allQuestions = questionRepository.findAll().stream()
                .filter(q -> q.getSubject().getId().equals(subject.getId()) && Boolean.TRUE.equals(q.getIsActive()))
                .filter(q -> q.getCourses() == null || q.getCourses().isEmpty() || q.getCourses().stream().anyMatch(c -> courseIdSet.contains(c.getId())))
                .collect(Collectors.toList());

        List<Question> theories = filterByType(allQuestions, QuestionType.LY_THUYET);
        List<Question> practices = filterByType(allQuestions, QuestionType.THUC_HANH);
        List<Question> essays = filterByType(allQuestions, QuestionType.TU_LUAN);
        List<Question> situations = filterByType(allQuestions, QuestionType.TINH_HUONG);

        // Validate enough questions
        validateQuestionCounts(theories.size(), practices.size(), essays.size(), situations.size(), numT, numP, numE, numS);

        // Create Master Exam record
        Exam exam = examMapper.toEntity(request, subject, courses);
        
        String deptCode = (subject.getDepartmentGroup() != null && subject.getDepartmentGroup().getDepartment() != null) 
                          ? subject.getDepartmentGroup().getDepartment().getCode() : "KHOA";
        String groupCode = subject.getDepartmentGroup() != null ? subject.getDepartmentGroup().getCode() : "BOMON";
        String subjectCode = subject.getSubjectCode();
        String courseCode = resolveCourseCode(courses);
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyy"));
        
        String baseCode = String.format("%s.%s.%s.%s.%s", deptCode, groupCode, subjectCode, courseCode, dateStr);
        String uniqueCode = baseCode;
        int counter = 1;
        while (examRepository.existsByCode(uniqueCode)) {
            uniqueCode = baseCode + String.format("-%02d", counter++);
        }
        
        exam.setCode(uniqueCode);
        exam = examRepository.save(exam);

        Set<Set<UUID>> generatedSets = new HashSet<>();

        // Generate N details
        for (int i = 0; i < request.getNumberOfExams(); i++) {
            List<Question> selectedQuestions = generateUniqueSet(numT, numP, numE, numS, theories, practices, essays, situations, generatedSets);
            
            ExamDetail detail = ExamDetail.builder()
                    .examSetCode(exam.getCode() + "-" + String.format("%02d", i + 1))
                    .orderNumber(i + 1)
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
    public ExamResponse updateExam(UUID id, ExamRequest request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đợt sinh đề không tồn tại với ID: " + id));

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại"));
        Set<Course> courses = resolveCourses(request);
        Set<UUID> courseIdSet = courses.stream().map(Course::getId).collect(Collectors.toSet());
        Set<UUID> oldCourseIds = (exam.getCourses() != null && !exam.getCourses().isEmpty())
                ? exam.getCourses().stream().map(Course::getId).collect(Collectors.toSet())
                : (exam.getCourse() != null ? Collections.singleton(exam.getCourse().getId()) : Collections.emptySet());
        boolean coursesChanged = !oldCourseIds.equals(courseIdSet);

        int[] counts = resolveQuestionCounts(request);
        int numT = counts[0], numP = counts[1], numE = counts[2], numS = counts[3];

        ExamStructureType structure = request.getExamStructure() != null ? request.getExamStructure() : ExamStructureType.CUSTOM;

        boolean structureChanged = !java.util.Objects.equals(exam.getNumberOfTheories(), numT)
                || !java.util.Objects.equals(exam.getNumberOfPractices(), numP)
                || !java.util.Objects.equals(exam.getNumberOfEssays(), numE)
                || !java.util.Objects.equals(exam.getNumberOfSituations(), numS)
                || !exam.getSubject().getId().equals(subject.getId())
                || coursesChanged;
        boolean examCountChanged = !java.util.Objects.equals(exam.getNumberOfExams(), request.getNumberOfExams());

        exam.setTitle(request.getTitle());
        exam.setSemester(request.getSemester());
        exam.setAcademicYear(request.getAcademicYear());
        exam.setDurationMinutes(request.getDurationMinutes());
        exam.setExamStructure(structure);
        exam.setNumberOfTheories(numT);
        exam.setNumberOfPractices(numP);
        exam.setNumberOfEssays(numE);
        exam.setNumberOfSituations(numS);
        exam.setSubject(subject);
        exam.setCourses(courses);
        exam.setCourse(courses.iterator().next());

        boolean shouldRegenerate = Boolean.TRUE.equals(request.getRegenerateQuestions()) 
                || exam.getExamDetails().isEmpty() 
                || structureChanged
                || examCountChanged;

        exam.setNumberOfExams(request.getNumberOfExams());

        if (shouldRegenerate) {
            // Load all active questions
            List<Question> allQuestions = questionRepository.findAll().stream()
                    .filter(q -> q.getSubject().getId().equals(subject.getId()) && Boolean.TRUE.equals(q.getIsActive()))
                    .filter(q -> q.getCourses() == null || q.getCourses().isEmpty() || q.getCourses().stream().anyMatch(c -> courseIdSet.contains(c.getId())))
                    .collect(Collectors.toList());

            List<Question> theories = filterByType(allQuestions, QuestionType.LY_THUYET);
            List<Question> practices = filterByType(allQuestions, QuestionType.THUC_HANH);
            List<Question> essays = filterByType(allQuestions, QuestionType.TU_LUAN);
            List<Question> situations = filterByType(allQuestions, QuestionType.TINH_HUONG);

            validateQuestionCounts(theories.size(), practices.size(), essays.size(), situations.size(), numT, numP, numE, numS);

            // Cleanly delete child questions and old details
            List<ExamDetail> oldDetails = examDetailRepository.findByExamId(exam.getId());
            for (ExamDetail d : oldDetails) {
                examQuestionRepository.deleteByExamDetailId(d.getId());
            }
            examQuestionRepository.flush();
            examDetailRepository.deleteAll(oldDetails);
            examDetailRepository.flush();
            exam.getExamDetails().clear();
            exam = examRepository.saveAndFlush(exam);

            Set<Set<UUID>> generatedSets = new HashSet<>();
            for (int i = 0; i < request.getNumberOfExams(); i++) {
                List<Question> selectedQuestions = generateUniqueSet(numT, numP, numE, numS, theories, practices, essays, situations, generatedSets);

                ExamDetail detail = ExamDetail.builder()
                        .examSetCode(exam.getCode() + "-" + String.format("%02d", i + 1))
                        .orderNumber(i + 1)
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
        }

        Exam updated = examRepository.save(exam);
        return examMapper.toResponse(updated);
    }

    @Transactional
    public void deleteExam(UUID id) {
        examRepository.deleteById(id);
    }

    private int[] resolveQuestionCounts(ExamRequest request) {
        int numT = request.getNumberOfTheories() != null ? request.getNumberOfTheories() : 0;
        int numP = request.getNumberOfPractices() != null ? request.getNumberOfPractices() : 0;
        int numE = request.getNumberOfEssays() != null ? request.getNumberOfEssays() : 0;
        int numS = request.getNumberOfSituations() != null ? request.getNumberOfSituations() : 0;

        if (numT == 0 && numP == 0 && numE == 0 && numS == 0 && request.getExamStructure() != null) {
            switch (request.getExamStructure()) {
                case THEORY_PRACTICE -> { numT = 1; numP = 1; }
                case ESSAY -> { numE = 1; }
                case THEORY_PRACTICE_SITUATION -> { numT = 1; numP = 1; numS = 1; }
                default -> {}
            }
        }

        if (numT + numP + numE + numS <= 0) {
            throw new IllegalArgumentException("Cấu trúc đề phải có ít nhất 1 câu hỏi.");
        }

        return new int[]{numT, numP, numE, numS};
    }

    private List<Question> filterByType(List<Question> list, QuestionType type) {
        return list.stream().filter(q -> q.getType() == type).collect(Collectors.toList());
    }

    private void validateQuestionCounts(int tAvailable, int pAvailable, int eAvailable, int sAvailable,
                                         int numT, int numP, int numE, int numS) {
        if (numT > 0 && tAvailable < numT) {
            throw new IllegalArgumentException(String.format("Không đủ câu hỏi Lý thuyết trong ngân hàng (yêu cầu %d, hiện có %d).", numT, tAvailable));
        }
        if (numP > 0 && pAvailable < numP) {
            throw new IllegalArgumentException(String.format("Không đủ câu hỏi Thực hành trong ngân hàng (yêu cầu %d, hiện có %d).", numP, pAvailable));
        }
        if (numE > 0 && eAvailable < numE) {
            throw new IllegalArgumentException(String.format("Không đủ câu hỏi Tự luận trong ngân hàng (yêu cầu %d, hiện có %d).", numE, eAvailable));
        }
        if (numS > 0 && sAvailable < numS) {
            throw new IllegalArgumentException(String.format("Không đủ câu hỏi Tình huống trong ngân hàng (yêu cầu %d, hiện có %d).", numS, sAvailable));
        }
    }

    private List<Question> generateUniqueSet(
            int numT, int numP, int numE, int numS,
            List<Question> tList, 
            List<Question> pList, 
            List<Question> eList, 
            List<Question> sList,
            Set<Set<UUID>> generatedSets) {
        
        int maxAttempts = 100;
        
        for (int i = 0; i < maxAttempts; i++) {
            List<Question> candidate = new ArrayList<>();
            candidate.addAll(getRandomSample(tList, numT));
            candidate.addAll(getRandomSample(pList, numP));
            candidate.addAll(getRandomSample(eList, numE));
            candidate.addAll(getRandomSample(sList, numS));
            
            Set<UUID> idSet = candidate.stream().map(Question::getId).collect(Collectors.toSet());
            if (!generatedSets.contains(idSet)) {
                generatedSets.add(idSet);
                return candidate;
            }
        }
        
        // Fallback if we run out of unique combinations
        List<Question> fallback = new ArrayList<>();
        fallback.addAll(getRandomSample(tList, numT));
        fallback.addAll(getRandomSample(pList, numP));
        fallback.addAll(getRandomSample(eList, numE));
        fallback.addAll(getRandomSample(sList, numS));
        return fallback;
    }

    private List<Question> getRandomSample(List<Question> list, int count) {
        if (count <= 0 || list == null || list.isEmpty()) {
            return Collections.emptyList();
        }
        List<Question> copy = new ArrayList<>(list);
        Collections.shuffle(copy);
        return copy.subList(0, Math.min(count, copy.size()));
    }
}
