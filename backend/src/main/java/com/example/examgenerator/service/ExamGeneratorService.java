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
import com.example.examgenerator.exception.InsufficientQuestionsException;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import com.example.examgenerator.util.SearchUtils;

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
        String safeSearch = SearchUtils.normalizeSearch(search);
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

    private List<Question> resolveAndValidateQuestions(Subject subject, Set<Course> courses, Set<UUID> courseIdSet) {
        // 1. Load all active questions for the subject
        List<Question> subjectQuestions = questionRepository.findAll().stream()
                .filter(q -> {
                    try {
                        return q.getSubject() != null && q.getSubject().getId().equals(subject.getId()) && Boolean.TRUE.equals(q.getIsActive());
                    } catch (Exception e) {
                        return false;
                    }
                })
                .collect(Collectors.toList());

        // 2. Check if any selected course has 0 questions in this subject
        for (Course c : courses) {
            boolean hasSpecific = subjectQuestions.stream()
                    .anyMatch(q -> q.getCourses() != null && q.getCourses().stream().anyMatch(qc -> qc != null && qc.getId().equals(c.getId())));
            boolean hasGeneral = subjectQuestions.stream()
                    .anyMatch(q -> q.getCourses() == null || q.getCourses().isEmpty());

            if (!hasSpecific && !hasGeneral) {
                throw new IllegalArgumentException(String.format(
                        "Đối tượng %s không có câu hỏi nào trong môn %s. Vui lòng loại bỏ đối tượng này trước khi sinh đề.",
                        c.getName(), subject.getSubjectName()
                ));
            }
        }

        // 3. Filter only common questions for all selected courses:
        // Either question is general (no course specified), OR question is assigned to ALL selected courses
        List<Question> commonQuestions = subjectQuestions.stream()
                .filter(q -> {
                    if (q.getCourses() == null || q.getCourses().isEmpty()) {
                        return true;
                    }
                    return courseIdSet.stream().allMatch(cId ->
                            q.getCourses().stream().anyMatch(qc -> qc != null && qc.getId().equals(cId)));
                })
                .collect(Collectors.toList());

        if (commonQuestions.isEmpty()) {
            throw new InsufficientQuestionsException(String.format(
                    "Không tìm thấy câu hỏi chung nào dành cho tất cả các đối tượng đã chọn trong môn %s.",
                    subject.getSubjectName()
            ));
        }

        return commonQuestions;
    }

    @Transactional
    public ExamResponse generateExam(ExamRequest request) {
        int numBatches = request.getNumberOfExams() != null && request.getNumberOfExams() >= 1 ? request.getNumberOfExams() : 1;
        int examsPerBatch = request.getExamsPerBatch() != null && request.getExamsPerBatch() >= 1 ? request.getExamsPerBatch() : 20;

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

        // Load common active questions for all selected courses
        List<Question> allQuestions = resolveAndValidateQuestions(subject, courses, courseIdSet);

        List<Question> theories = filterByType(allQuestions, QuestionType.LY_THUYET);
        List<Question> practices = filterByType(allQuestions, QuestionType.THUC_HANH);
        List<Question> essays = filterByType(allQuestions, QuestionType.TU_LUAN);
        List<Question> situations = filterByType(allQuestions, QuestionType.TINH_HUONG);

        // Validate enough questions
        validateQuestionCounts(theories.size(), practices.size(), essays.size(), situations.size(), numT, numP, numE, numS);

        // Create Master Exam record
        Exam exam = examMapper.toEntity(request, subject, courses);
        exam.setNumberOfExams(numBatches); // Lưu số bộ đề vào numberOfExams (total_exam_sets)
        
        String deptCode = "KHOA";
        String groupCode = "BOMON";
        try {
            if (subject.getDepartmentGroup() != null) {
                groupCode = subject.getDepartmentGroup().getCode();
                if (subject.getDepartmentGroup().getDepartment() != null) {
                    deptCode = subject.getDepartmentGroup().getDepartment().getCode();
                }
            }
        } catch (Exception ignored) {}
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

        // Generate N batches, each having examsPerBatch details
        for (int batch = 1; batch <= numBatches; batch++) {
            Set<Set<UUID>> generatedSetsInBatch = new HashSet<>();
            for (int i = 0; i < examsPerBatch; i++) {
                List<Question> selectedQuestions = generateUniqueSet(numT, numP, numE, numS, theories, practices, essays, situations, generatedSetsInBatch);

                String setCode = (numBatches > 1)
                        ? String.format("%s-B%02d-%02d", exam.getCode(), batch, i + 1)
                        : String.format("%s-%02d", exam.getCode(), i + 1);

                ExamDetail detail = ExamDetail.builder()
                        .batchNumber(batch)
                        .orderNumber(i + 1)
                        .examSetCode(setCode)
                        .exam(exam)
                        .build();
                detail = examDetailRepository.save(detail);
                exam.getExamDetails().add(detail);

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
        Set<UUID> oldCourseIds = Collections.emptySet();
        try {
            if (exam.getCourses() != null && !exam.getCourses().isEmpty()) {
                oldCourseIds = exam.getCourses().stream().map(Course::getId).collect(Collectors.toSet());
            } else if (exam.getCourse() != null) {
                oldCourseIds = Collections.singleton(exam.getCourse().getId());
            }
        } catch (Exception ignored) {}
        boolean coursesChanged = !oldCourseIds.equals(courseIdSet);

        int[] counts = resolveQuestionCounts(request);
        int numT = counts[0], numP = counts[1], numE = counts[2], numS = counts[3];

        ExamStructureType structure = request.getExamStructure() != null ? request.getExamStructure() : ExamStructureType.CUSTOM;

        boolean subjectChanged = true;
        try {
            subjectChanged = exam.getSubject() == null || !exam.getSubject().getId().equals(subject.getId());
        } catch (Exception ignored) {}

        int numBatches = request.getNumberOfExams() != null && request.getNumberOfExams() >= 1 ? request.getNumberOfExams() : 1;
        int examsPerBatch = request.getExamsPerBatch() != null && request.getExamsPerBatch() >= 1 ? request.getExamsPerBatch() : 20;

        int currentBatchCount = exam.getNumberOfExams();
        int currentExamsPerBatch = 0;
        if (exam.getExamDetails() != null && !exam.getExamDetails().isEmpty()) {
            int firstB = exam.getExamDetails().get(0).getBatchNumber();
            currentExamsPerBatch = (int) exam.getExamDetails().stream().filter(d -> d.getBatchNumber() == firstB).count();
        }

        boolean batchesChanged = currentBatchCount != numBatches;
        boolean examsPerBatchChanged = currentExamsPerBatch != examsPerBatch;

        boolean structureChanged = !java.util.Objects.equals(exam.getNumberOfTheories(), numT)
                || !java.util.Objects.equals(exam.getNumberOfPractices(), numP)
                || !java.util.Objects.equals(exam.getNumberOfEssays(), numE)
                || !java.util.Objects.equals(exam.getNumberOfSituations(), numS)
                || subjectChanged
                || coursesChanged;

        exam.setTitle(request.getTitle());
        exam.setSemester(request.getSemester());
        
        java.time.LocalDateTime parsedExamDate = null;
        if (request.getExamDate() != null && !request.getExamDate().trim().isEmpty()) {
            try {
                String s = request.getExamDate().trim();
                if (s.length() == 10) {
                    parsedExamDate = java.time.LocalDate.parse(s).atStartOfDay();
                } else {
                    parsedExamDate = java.time.LocalDateTime.parse(s);
                }
            } catch (Exception ignored) {}
        }
        exam.setExamDate(parsedExamDate);

        String academicYear = request.getAcademicYear();
        if (academicYear == null || academicYear.trim().isEmpty()) {
            int y = parsedExamDate != null ? parsedExamDate.getYear() : java.time.LocalDate.now().getYear();
            academicYear = y + "-" + (y + 1);
        }
        exam.setAcademicYear(academicYear);

        String unitNormalization = request.getUnit();
        if (unitNormalization == null || unitNormalization.trim().isEmpty()) {
            unitNormalization = null;
        } else {
            Pattern pattern = Pattern.compile(
                    "(?i)đại\\s+đội\\s+([\\w\\d\\p{L}]+)\\s*[,\\-_/\\s]+\\s*tiểu\\s+đoàn\\s+([\\w\\d\\p{L}]+)",
                    Pattern.UNICODE_CHARACTER_CLASS
            );

            Matcher matcher = pattern.matcher(unitNormalization.trim());
            if (matcher.find()) {
                String daiDoi = matcher.group(1).trim();
                String tieuDoan = matcher.group(2).trim();
                unitNormalization = String.format("Đại đội %s - Tiểu đoàn %s", daiDoi, tieuDoan);
            } else {
                unitNormalization = unitNormalization.trim()
                        .replaceAll("(?i)đại\\s+đội", "Đại đội")
                        .replaceAll("(?i)tiểu\\s+đoàn", "Tiểu đoàn")
                        .replaceAll("\\s*[,\\-]+\\s*", " - ")
                        .replaceAll("\\s{2,}", " ");
            }
        }
        exam.setUnit(unitNormalization);
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
                || exam.getExamDetails() == null || exam.getExamDetails().isEmpty() 
                || structureChanged
                || batchesChanged
                || examsPerBatchChanged;

        exam.setNumberOfExams(numBatches);

        if (shouldRegenerate) {
            // Load common active questions
            List<Question> allQuestions = resolveAndValidateQuestions(subject, courses, courseIdSet);

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
            if (exam.getExamDetails() != null) {
                exam.getExamDetails().clear();
            }
            exam = examRepository.saveAndFlush(exam);

            for (int batch = 1; batch <= numBatches; batch++) {
                Set<Set<UUID>> generatedSetsInBatch = new HashSet<>();
                for (int i = 0; i < examsPerBatch; i++) {
                    List<Question> selectedQuestions = generateUniqueSet(numT, numP, numE, numS, theories, practices, essays, situations, generatedSetsInBatch);

                    String setCode = (numBatches > 1)
                            ? String.format("%s-B%02d-%02d", exam.getCode(), batch, i + 1)
                            : String.format("%s-%02d", exam.getCode(), i + 1);

                    ExamDetail detail = ExamDetail.builder()
                            .batchNumber(batch)
                            .orderNumber(i + 1)
                            .examSetCode(setCode)
                            .exam(exam)
                            .build();
                    detail = examDetailRepository.save(detail);
                exam.getExamDetails().add(detail);

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
        }

        Exam updated = examRepository.save(exam);
        return examMapper.toResponse(updated);
    }

    @Transactional
    public void deleteExam(UUID id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đợt thi không tồn tại với ID: " + id));
        try {
            List<ExamDetail> details = examDetailRepository.findByExamId(id);
            for (ExamDetail detail : details) {
                examQuestionRepository.deleteByExamDetailId(detail.getId());
            }
            examQuestionRepository.flush();
            examDetailRepository.deleteAll(details);
            examDetailRepository.flush();

            if (exam.getCourses() != null) {
                exam.getCourses().clear();
            }
            if (exam.getExamDetails() != null) {
                exam.getExamDetails().clear();
            }
            examRepository.saveAndFlush(exam);
            examRepository.delete(exam);
            examRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Không thể xóa đợt thi này do có dữ liệu liên quan. Vui lòng kiểm tra lại!");
        }
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
            throw new InsufficientQuestionsException(String.format("Không đủ câu hỏi Lý thuyết trong ngân hàng (yêu cầu %d, hiện có %d).", numT, tAvailable));
        }
        if (numP > 0 && pAvailable < numP) {
            throw new InsufficientQuestionsException(String.format("Không đủ câu hỏi Thực hành trong ngân hàng (yêu cầu %d, hiện có %d).", numP, pAvailable));
        }
        if (numE > 0 && eAvailable < numE) {
            throw new InsufficientQuestionsException(String.format("Không đủ câu hỏi Tự luận trong ngân hàng (yêu cầu %d, hiện có %d).", numE, eAvailable));
        }
        if (numS > 0 && sAvailable < numS) {
            throw new InsufficientQuestionsException(String.format("Không đủ câu hỏi Tình huống trong ngân hàng (yêu cầu %d, hiện có %d).", numS, sAvailable));
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
