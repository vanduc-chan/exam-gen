package com.example.examgenerator.service;

import com.example.examgenerator.dto.request.BatchSubjectAvailabilityRequest;
import com.example.examgenerator.dto.request.BlueprintSectionDto;
import com.example.examgenerator.dto.request.BlueprintSlotDto;
import com.example.examgenerator.dto.request.ExamBlueprintRequest;
import com.example.examgenerator.dto.request.GraduationExamRequest;
import com.example.examgenerator.dto.request.SlotAvailabilityRequest;
import com.example.examgenerator.dto.response.ExamBlueprintResponse;
import com.example.examgenerator.dto.response.ExamResponse;
import com.example.examgenerator.dto.response.SlotAvailabilityResponse;
import com.example.examgenerator.dto.response.SubjectAvailabilityItemResponse;
import com.example.examgenerator.entity.Course;
import com.example.examgenerator.entity.Exam;
import com.example.examgenerator.entity.ExamBlueprint;
import com.example.examgenerator.entity.ExamDetail;
import com.example.examgenerator.entity.ExamQuestion;
import com.example.examgenerator.entity.Question;
import com.example.examgenerator.entity.Subject;
import com.example.examgenerator.enumerate.ExamStatus;
import com.example.examgenerator.enumerate.ExamStructureType;
import com.example.examgenerator.enumerate.QuestionType;
import com.example.examgenerator.enumerate.SlotSourceType;
import com.example.examgenerator.exception.InsufficientQuestionsException;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.mapper.ExamMapper;
import com.example.examgenerator.repository.CourseRepository;
import com.example.examgenerator.repository.ExamBlueprintRepository;
import com.example.examgenerator.repository.ExamDetailRepository;
import com.example.examgenerator.repository.ExamQuestionRepository;
import com.example.examgenerator.repository.ExamRepository;
import com.example.examgenerator.repository.QuestionRepository;
import com.example.examgenerator.repository.SubjectRepository;
import com.example.examgenerator.util.SearchUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GraduationExamService {

    private final ExamRepository examRepository;
    private final ExamDetailRepository examDetailRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final ExamBlueprintRepository examBlueprintRepository;
    private final SubjectRepository subjectRepository;
    private final CourseRepository courseRepository;
    private final QuestionRepository questionRepository;
    private final ExamMapper examMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ==========================================
    // 1. BLUEPRINT TEMPLATES ("KHUNG ĐỀ MẪU")
    // ==========================================

    @Transactional(readOnly = true)
    public List<ExamBlueprintResponse> getAllBlueprints(UUID courseId) {
        return examBlueprintRepository.findByCourseFilter(courseId).stream()
                .map(this::toBlueprintResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExamBlueprintResponse getBlueprintById(UUID id) {
        ExamBlueprint blueprint = examBlueprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khung đề mẫu không tồn tại với ID: " + id));
        return toBlueprintResponse(blueprint);
    }

    @Transactional
    public ExamBlueprintResponse createBlueprint(ExamBlueprintRequest request) {
        Set<Course> courses = resolveCourses(request.getCourseIds());
        List<BlueprintSectionDto> normalizedSections = normalizeAndEnrichSections(request.getSections());
        String sectionsJson = serializeSections(normalizedSections);

        ExamBlueprint blueprint = ExamBlueprint.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .courses(courses)
                .sectionsJson(sectionsJson)
                .build();

        blueprint = examBlueprintRepository.save(blueprint);
        return toBlueprintResponse(blueprint);
    }

    @Transactional
    public ExamBlueprintResponse updateBlueprint(UUID id, ExamBlueprintRequest request) {
        ExamBlueprint blueprint = examBlueprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khung đề mẫu không tồn tại với ID: " + id));

        Set<Course> courses = resolveCourses(request.getCourseIds());
        List<BlueprintSectionDto> normalizedSections = normalizeAndEnrichSections(request.getSections());
        String sectionsJson = serializeSections(normalizedSections);

        blueprint.setName(request.getName().trim());
        blueprint.setDescription(request.getDescription());
        blueprint.setCourses(courses);
        blueprint.setSectionsJson(sectionsJson);

        blueprint = examBlueprintRepository.save(blueprint);
        return toBlueprintResponse(blueprint);
    }

    @Transactional
    public void deleteBlueprint(UUID id) {
        if (!examBlueprintRepository.existsById(id)) {
            throw new ResourceNotFoundException("Khung đề mẫu không tồn tại với ID: " + id);
        }
        examBlueprintRepository.deleteById(id);
    }

    private ExamBlueprintResponse toBlueprintResponse(ExamBlueprint entity) {
        List<UUID> courseIds = new ArrayList<>();
        List<String> courseNames = new ArrayList<>();
        List<String> courseCodes = new ArrayList<>();

        if (entity.getCourses() != null) {
            for (Course c : entity.getCourses()) {
                if (c != null) {
                    if (c.getId() != null) courseIds.add(c.getId());
                    if (c.getName() != null) courseNames.add(c.getName());
                    if (c.getCourseCode() != null) courseCodes.add(c.getCourseCode());
                }
            }
        }

        List<BlueprintSectionDto> sections = deserializeSections(entity.getSectionsJson());
        int totalQuestions = 0;
        double totalScore = 0.0;
        for (BlueprintSectionDto sec : sections) {
            if (sec.getSlots() != null) {
                for (BlueprintSlotDto slot : sec.getSlots()) {
                    int count = Math.max(1, slot.getQuestionCount());
                    totalQuestions += count;
                    double s = (slot.getScore() != null && slot.getScore() > 0) ? slot.getScore() : 0.0;
                    totalScore += s * count;
                }
            }
        }

        return ExamBlueprintResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .courseIds(courseIds)
                .courseNames(courseNames)
                .courseCodes(courseCodes)
                .sections(sections)
                .totalQuestions(totalQuestions)
                .totalScore(Math.round(totalScore * 100.0) / 100.0)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    // ==========================================
    // 2. SLOT AVAILABILITY CHECK
    // ==========================================

    @Transactional(readOnly = true)
    public SlotAvailabilityResponse checkSlotAvailability(SlotAvailabilityRequest request) {
        if (request.getSubjectId() == null) {
            return SlotAvailabilityResponse.builder()
                    .availableCount(0)
                    .valid(false)
                    .message("Chưa chọn môn học")
                    .build();
        }
        if (request.getCourseIds() == null || request.getCourseIds().isEmpty()) {
            return SlotAvailabilityResponse.builder()
                    .availableCount(0)
                    .valid(false)
                    .message("Vui lòng chọn ít nhất một đối tượng dự thi")
                    .build();
        }

        Subject subject = subjectRepository.findById(request.getSubjectId()).orElse(null);
        if (subject == null) {
            return SlotAvailabilityResponse.builder()
                    .availableCount(0)
                    .valid(false)
                    .message("Môn học không tồn tại")
                    .build();
        }

        Set<Course> courses = resolveCourses(request.getCourseIds());
        Set<UUID> courseIdSet = courses.stream().map(Course::getId).collect(Collectors.toSet());

        try {
            List<Question> commonQuestions = resolveCommonSubjectQuestions(subject, courses, courseIdSet);
            List<Question> filtered = commonQuestions.stream()
                    .filter(q -> request.getQuestionType() == null || q.getType() == request.getQuestionType())
                    .filter(q -> request.getDifficultyLevel() == null || q.getDifficultyLevel() == request.getDifficultyLevel())
                    .collect(Collectors.toList());

            return SlotAvailabilityResponse.builder()
                    .availableCount(filtered.size())
                    .valid(!filtered.isEmpty())
                    .message("Kho có " + filtered.size() + " câu phù hợp")
                    .build();
        } catch (IllegalArgumentException | InsufficientQuestionsException ex) {
            return SlotAvailabilityResponse.builder()
                    .availableCount(0)
                    .valid(false)
                    .message(ex.getMessage())
                    .build();
        }
    }

    @Transactional(readOnly = true)
    public Map<UUID, SubjectAvailabilityItemResponse> checkBatchSubjectAvailability(
            BatchSubjectAvailabilityRequest request) {
        Map<UUID, SubjectAvailabilityItemResponse> results = new HashMap<>();
        if (request == null || request.getSubjectIds() == null || request.getSubjectIds().isEmpty()) {
            return results;
        }
        Set<UUID> requestedSubjectIds = new LinkedHashSet<>(request.getSubjectIds());
        Map<UUID, Subject> subjectMap = subjectRepository.findAllById(requestedSubjectIds).stream()
                .collect(Collectors.toMap(Subject::getId, s -> s, (a, b) -> a));

        if (request.getCourseIds() == null || request.getCourseIds().isEmpty()) {
            for (UUID subId : requestedSubjectIds) {
                Subject sub = subjectMap.get(subId);
                results.put(subId, SubjectAvailabilityItemResponse.builder()
                        .subjectId(subId)
                        .subjectName(sub != null ? sub.getSubjectName() : "")
                        .totalAvailable(0)
                        .countByType(Collections.emptyMap())
                        .valid(false)
                        .message("Vui lòng chọn đối tượng dự thi")
                        .build());
            }
            return results;
        }

        Set<Course> courses = resolveCourses(request.getCourseIds());
        Set<UUID> courseIdSet = courses.stream().map(Course::getId).collect(Collectors.toSet());

        // Single pass over active questions for all requested subjects
        List<Question> allActiveQuestions = questionRepository.findAll().stream()
                .filter(q -> {
                    try {
                        return q.getSubject() != null
                                && requestedSubjectIds.contains(q.getSubject().getId())
                                && Boolean.TRUE.equals(q.getIsActive());
                    } catch (Exception e) {
                        return false;
                    }
                })
                .collect(Collectors.toList());

        Map<UUID, List<Question>> questionsBySubject = allActiveQuestions.stream()
                .collect(Collectors.groupingBy(q -> q.getSubject().getId()));

        for (UUID subId : requestedSubjectIds) {
            Subject subject = subjectMap.get(subId);
            if (subject == null) {
                continue;
            }
            List<Question> subQuestions = questionsBySubject.getOrDefault(subId, Collections.emptyList());

            String invalidCourseMsg = null;
            for (Course c : courses) {
                boolean hasSpecific = subQuestions.stream()
                        .anyMatch(q -> q.getCourses() != null && q.getCourses().stream().anyMatch(qc -> qc != null && qc.getId().equals(c.getId())));
                boolean hasGeneral = subQuestions.stream()
                        .anyMatch(q -> q.getCourses() == null || q.getCourses().isEmpty());
                if (!hasSpecific && !hasGeneral) {
                    invalidCourseMsg = String.format(
                            "Đối tượng %s không có câu hỏi nào trong môn %s.",
                            c.getName(), subject.getSubjectName()
                    );
                    break;
                }
            }

            if (invalidCourseMsg != null) {
                results.put(subId, SubjectAvailabilityItemResponse.builder()
                        .subjectId(subId)
                        .subjectName(subject.getSubjectName())
                        .totalAvailable(0)
                        .countByType(Collections.emptyMap())
                        .valid(false)
                        .message(invalidCourseMsg)
                        .build());
                continue;
            }

            List<Question> commonQuestions = subQuestions.stream()
                    .filter(q -> {
                        if (q.getCourses() == null || q.getCourses().isEmpty()) {
                            return true;
                        }
                        return courseIdSet.stream().allMatch(cId ->
                                q.getCourses().stream().anyMatch(qc -> qc != null && qc.getId().equals(cId)));
                    })
                    .collect(Collectors.toList());

            Map<String, Long> countByType = new HashMap<>();
            countByType.put("ALL", (long) commonQuestions.size());
            for (QuestionType qt : QuestionType.values()) {
                long c = commonQuestions.stream().filter(q -> q.getType() == qt).count();
                countByType.put(qt.name(), c);
            }

            boolean valid = !commonQuestions.isEmpty();
            String msg = valid
                    ? ("Kho có " + commonQuestions.size() + " câu phù hợp")
                    : ("Không có câu hỏi chung cho các đối tượng đã chọn trong môn " + subject.getSubjectName());

            results.put(subId, SubjectAvailabilityItemResponse.builder()
                    .subjectId(subId)
                    .subjectName(subject.getSubjectName())
                    .totalAvailable(commonQuestions.size())
                    .countByType(countByType)
                    .valid(valid)
                    .message(msg)
                    .build());
        }

        return results;
    }

    // ==========================================
    // 3. GRADUATION EXAM GENERATION & MANAGEMENT
    // ==========================================

    @Transactional(readOnly = true)
    public Page<ExamResponse> getGraduationExams(UUID courseId, String search, Pageable pageable) {
        String safeSearch = SearchUtils.normalizeSearch(search);
        return examRepository.findGraduationExamsWithFilters(courseId, safeSearch, pageable)
                .map(examMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ExamResponse getGraduationExamById(UUID id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi tốt nghiệp không tồn tại với ID: " + id));
        return examMapper.toResponse(exam);
    }

    @Transactional
    public ExamResponse generateGraduationExam(GraduationExamRequest request) {
        int numBatches = request.getNumberOfExams() != null && request.getNumberOfExams() >= 1 ? request.getNumberOfExams() : 1;
        int examsPerBatch = request.getExamsPerBatch() != null && request.getExamsPerBatch() >= 1 ? request.getExamsPerBatch() : 20;

        Set<Course> courses = resolveCourses(request.getCourseIds());
        Set<UUID> courseIdSet = courses.stream().map(Course::getId).collect(Collectors.toSet());

        List<BlueprintSectionDto> normalizedSections = normalizeAndEnrichSections(request.getSections());
        List<ResolvedSlot> resolvedSlots = resolveAllSlots(normalizedSections, courses, courseIdSet);

        Subject primarySubject = resolvedSlots.get(0).subject;
        Course primaryCourse = courses.iterator().next();

        LocalDateTime parsedExamDate = parseExamDate(request.getExamDate());
        String academicYear = request.getAcademicYear();
        if (academicYear == null || academicYear.trim().isEmpty()) {
            int y = parsedExamDate != null ? parsedExamDate.getYear() : LocalDate.now().getYear();
            academicYear = y + "-" + (y + 1);
        }

        int[] typeSummary = summarizeTypes(resolvedSlots);

        String courseCode = resolveCourseCode(courses);
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyy"));
        String baseCode = String.format("TN.%s.%s", courseCode, dateStr);
        String uniqueCode = baseCode;
        int counter = 1;
        while (examRepository.existsByCode(uniqueCode)) {
            uniqueCode = baseCode + String.format("-%02d", counter++);
        }

        Exam exam = Exam.builder()
                .code(uniqueCode)
                .title(request.getTitle().trim())
                .examType("GRADUATION")
                .blueprintId(request.getBlueprintId())
                .blueprintSnapshot(serializeSections(normalizedSections))
                .subject(primarySubject)
                .course(primaryCourse)
                .courses(courses)
                .semester(request.getSemester() != null ? request.getSemester() : "Cuối khóa")
                .academicYear(academicYear)
                .unit(request.getUnit())
                .examDate(parsedExamDate)
                .durationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 120)
                .examStructure(ExamStructureType.CUSTOM)
                .numberOfTheories(typeSummary[0])
                .numberOfPractices(typeSummary[1])
                .numberOfEssays(typeSummary[2])
                .numberOfSituations(typeSummary[3])
                .numberOfExams(numBatches)
                .status(ExamStatus.GENERATED)
                .build();

        exam = examRepository.save(exam);

        generateBatchesForGraduationExam(exam, numBatches, examsPerBatch, resolvedSlots);

        return examMapper.toResponse(exam);
    }

    @Transactional
    public ExamResponse updateGraduationExam(UUID id, GraduationExamRequest request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi tốt nghiệp không tồn tại với ID: " + id));

        int numBatches = request.getNumberOfExams() != null && request.getNumberOfExams() >= 1 ? request.getNumberOfExams() : 1;
        int examsPerBatch = request.getExamsPerBatch() != null && request.getExamsPerBatch() >= 1 ? request.getExamsPerBatch() : 20;

        Set<Course> courses = resolveCourses(request.getCourseIds());
        Set<UUID> courseIdSet = courses.stream().map(Course::getId).collect(Collectors.toSet());

        List<BlueprintSectionDto> normalizedSections = normalizeAndEnrichSections(request.getSections());
        String newSnapshot = serializeSections(normalizedSections);

        boolean snapshotChanged = !Objects.equals(exam.getBlueprintSnapshot(), newSnapshot);
        Set<UUID> oldCourseIds = exam.getCourses() != null
                ? exam.getCourses().stream().map(Course::getId).collect(Collectors.toSet())
                : Collections.emptySet();
        boolean coursesChanged = !oldCourseIds.equals(courseIdSet);

        int currentBatchCount = exam.getNumberOfExams();
        int currentExamsPerBatch = 0;
        if (exam.getExamDetails() != null && !exam.getExamDetails().isEmpty()) {
            int firstB = exam.getExamDetails().get(0).getBatchNumber();
            currentExamsPerBatch = (int) exam.getExamDetails().stream().filter(d -> d.getBatchNumber() == firstB).count();
        }
        boolean countsChanged = (currentBatchCount != numBatches) || (currentExamsPerBatch != examsPerBatch);
        boolean shouldRegenerate = Boolean.TRUE.equals(request.getRegenerateQuestions())
                || snapshotChanged || coursesChanged || countsChanged;

        List<ResolvedSlot> resolvedSlots = resolveAllSlots(normalizedSections, courses, courseIdSet);
        Subject primarySubject = resolvedSlots.get(0).subject;
        Course primaryCourse = courses.iterator().next();
        LocalDateTime parsedExamDate = parseExamDate(request.getExamDate());
        int[] typeSummary = summarizeTypes(resolvedSlots);

        exam.setTitle(request.getTitle().trim());
        exam.setExamType("GRADUATION");
        exam.setBlueprintId(request.getBlueprintId());
        exam.setBlueprintSnapshot(newSnapshot);
        exam.setSubject(primarySubject);
        exam.setCourse(primaryCourse);
        exam.setCourses(courses);
        exam.setSemester(request.getSemester() != null ? request.getSemester() : "Cuối khóa");
        if (request.getAcademicYear() != null && !request.getAcademicYear().trim().isEmpty()) {
            exam.setAcademicYear(request.getAcademicYear().trim());
        }
        exam.setUnit(request.getUnit());
        exam.setExamDate(parsedExamDate);
        if (request.getDurationMinutes() != null) {
            exam.setDurationMinutes(request.getDurationMinutes());
        }
        exam.setNumberOfTheories(typeSummary[0]);
        exam.setNumberOfPractices(typeSummary[1]);
        exam.setNumberOfEssays(typeSummary[2]);
        exam.setNumberOfSituations(typeSummary[3]);
        exam.setNumberOfExams(numBatches);

        if (shouldRegenerate) {
            if (exam.getExamDetails() != null) {
                for (ExamDetail oldDetail : exam.getExamDetails()) {
                    examQuestionRepository.deleteByExamDetailId(oldDetail.getId());
                }
                exam.getExamDetails().clear();
            }
            examDetailRepository.flush();
            generateBatchesForGraduationExam(exam, numBatches, examsPerBatch, resolvedSlots);
        }

        exam = examRepository.save(exam);
        return examMapper.toResponse(exam);
    }

    @Transactional
    public void deleteGraduationExam(UUID id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi tốt nghiệp không tồn tại với ID: " + id));
        if (exam.getExamDetails() != null) {
            for (ExamDetail detail : exam.getExamDetails()) {
                examQuestionRepository.deleteByExamDetailId(detail.getId());
            }
        }
        examRepository.delete(exam);
    }

    // ==========================================
    // INTERNAL HELPERS & GENERATION ENGINE
    // ==========================================

    private static class ResolvedSlot {
        String sectionTitle;
        BlueprintSlotDto slotDto;
        Subject subject;
        List<Question> candidatePool;
        int questionCount;
        Double score;
    }

    private static class SelectedQuestionWithScore {
        Question question;
        Double score;

        SelectedQuestionWithScore(Question question, Double score) {
            this.question = question;
            this.score = score;
        }
    }

    private void generateBatchesForGraduationExam(
            Exam exam,
            int numBatches,
            int examsPerBatch,
            List<ResolvedSlot> resolvedSlots
    ) {
        for (int batch = 1; batch <= numBatches; batch++) {
            Set<List<UUID>> generatedSignaturesInBatch = new HashSet<>();

            for (int i = 0; i < examsPerBatch; i++) {
                List<SelectedQuestionWithScore> pickedForExam = pickQuestionsForSingleExam(
                        resolvedSlots,
                        generatedSignaturesInBatch
                );

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

                int continuousOrder = 1;
                for (SelectedQuestionWithScore item : pickedForExam) {
                    Double finalScore = (item.score != null && item.score > 0)
                            ? item.score
                            : item.question.getScore();
                    ExamQuestion eq = ExamQuestion.builder()
                            .examDetail(detail)
                            .question(item.question)
                            .questionOrder(continuousOrder++)
                            .score(finalScore)
                            .build();
                    examQuestionRepository.save(eq);
                }
            }
        }
    }

    private List<SelectedQuestionWithScore> pickQuestionsForSingleExam(
            List<ResolvedSlot> resolvedSlots,
            Set<List<UUID>> generatedSignaturesInBatch
    ) {
        List<SelectedQuestionWithScore> bestAttempt = new ArrayList<>();
        int maxAttempts = 50;

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            List<SelectedQuestionWithScore> currentAttempt = new ArrayList<>();
            Set<UUID> usedInThisExam = new HashSet<>();

            for (ResolvedSlot rSlot : resolvedSlots) {
                SlotSourceType sourceType = rSlot.slotDto.getSourceType() != null
                        ? rSlot.slotDto.getSourceType()
                        : SlotSourceType.BANK_RANDOM;
                int count = Math.max(1, rSlot.questionCount);

                if (sourceType == SlotSourceType.BANK_FIXED) {
                    // Fixed questions keep exact order
                    int limit = Math.min(count, rSlot.candidatePool.size());
                    for (int k = 0; k < limit; k++) {
                        Question q = rSlot.candidatePool.get(k);
                        currentAttempt.add(new SelectedQuestionWithScore(q, rSlot.score));
                        usedInThisExam.add(q.getId());
                    }
                } else {
                    // BANK_RANDOM or BANK_PICKED: draw `count` questions not yet used in this exam
                    List<Question> available = rSlot.candidatePool.stream()
                            .filter(q -> !usedInThisExam.contains(q.getId()))
                            .collect(Collectors.toList());
                    if (available.size() < count) {
                        available = new ArrayList<>(rSlot.candidatePool);
                    }
                    Collections.shuffle(available);
                    for (int k = 0; k < count && k < available.size(); k++) {
                        Question q = available.get(k);
                        currentAttempt.add(new SelectedQuestionWithScore(q, rSlot.score));
                        usedInThisExam.add(q.getId());
                    }
                }
            }

            bestAttempt = currentAttempt;
            List<UUID> signature = currentAttempt.stream()
                    .map(item -> item.question.getId())
                    .collect(Collectors.toList());
            if (!generatedSignaturesInBatch.contains(signature)) {
                generatedSignaturesInBatch.add(signature);
                return currentAttempt;
            }
        }

        return bestAttempt;
    }

    private List<ResolvedSlot> resolveAllSlots(
            List<BlueprintSectionDto> sections,
            Set<Course> courses,
            Set<UUID> courseIdSet
    ) {
        if (sections == null || sections.isEmpty()) {
            throw new IllegalArgumentException("Đề thi tốt nghiệp phải có ít nhất một phần thi (Section)");
        }

        List<ResolvedSlot> result = new ArrayList<>();
        Map<UUID, List<Question>> subjectCommonCache = new HashMap<>();

        for (int sIdx = 0; sIdx < sections.size(); sIdx++) {
            BlueprintSectionDto sec = sections.get(sIdx);
            String secTitle = (sec.getTitle() != null && !sec.getTitle().isBlank())
                    ? sec.getTitle().trim()
                    : ("Phần " + (sIdx + 1));

            if (sec.getSlots() == null || sec.getSlots().isEmpty()) {
                throw new IllegalArgumentException(secTitle + " chưa có ô câu hỏi (Slot) nào. Vui lòng thêm ít nhất 1 ô câu hỏi!");
            }

            for (int slotIdx = 0; slotIdx < sec.getSlots().size(); slotIdx++) {
                BlueprintSlotDto slot = sec.getSlots().get(slotIdx);
                SlotSourceType sourceType = slot.getSourceType() != null ? slot.getSourceType() : SlotSourceType.BANK_RANDOM;
                int count = Math.max(1, slot.getQuestionCount());

                UUID effectiveSubjectId = slot.getSubjectId() != null ? slot.getSubjectId() : sec.getSubjectId();
                Subject subject = null;
                if (effectiveSubjectId != null) {
                    subject = subjectRepository.findById(effectiveSubjectId)
                            .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại ở " + secTitle));
                }

                List<Question> pool;
                if (sourceType == SlotSourceType.BANK_RANDOM) {
                    if (subject == null) {
                        throw new IllegalArgumentException(String.format(
                                "Vui lòng chọn môn học cho ô câu hỏi thứ %d trong %s.",
                                slotIdx + 1, secTitle
                        ));
                    }
                    final Subject finalSubject = subject;
                    List<Question> commonQuestions = subjectCommonCache.computeIfAbsent(
                            finalSubject.getId(),
                            k -> resolveCommonSubjectQuestions(finalSubject, courses, courseIdSet)
                    );
                    pool = commonQuestions.stream()
                            .filter(q -> slot.getQuestionType() == null || q.getType() == slot.getQuestionType())
                            .filter(q -> slot.getDifficultyLevel() == null || q.getDifficultyLevel() == slot.getDifficultyLevel())
                            .collect(Collectors.toList());

                    if (pool.size() < count) {
                        String typeLabel = formatQuestionTypeLabel(slot.getQuestionType());
                        throw new InsufficientQuestionsException(String.format(
                                "%s - Ô câu hỏi %d (%s - %s) yêu cầu %d câu nhưng kho câu hỏi chung chỉ có %d câu phù hợp.",
                                secTitle, slotIdx + 1, subject.getSubjectName(), typeLabel, count, pool.size()
                        ));
                    }
                } else if (sourceType == SlotSourceType.BANK_PICKED || sourceType == SlotSourceType.BANK_FIXED) {
                    if (slot.getQuestionIds() == null || slot.getQuestionIds().isEmpty()) {
                        throw new IllegalArgumentException(String.format(
                                "%s - Ô câu hỏi %d (%s) chưa chọn câu hỏi nào từ ngân hàng.",
                                secTitle, slotIdx + 1,
                                sourceType == SlotSourceType.BANK_FIXED ? "Cố định câu hỏi" : "Chọn nhóm câu hỏi"
                        ));
                    }
                    Map<UUID, Question> qMap = questionRepository.findAllById(slot.getQuestionIds()).stream()
                            .collect(Collectors.toMap(Question::getId, q -> q, (a, b) -> a));
                    pool = new ArrayList<>();
                    for (UUID qId : slot.getQuestionIds()) {
                        Question q = qMap.get(qId);
                        if (q != null) {
                            pool.add(q);
                        }
                    }
                    if (pool.isEmpty()) {
                        throw new IllegalArgumentException(String.format(
                                "%s - Ô câu hỏi %d không tìm thấy câu hỏi hợp lệ trong ngân hàng.",
                                secTitle, slotIdx + 1
                        ));
                    }
                    if (sourceType == SlotSourceType.BANK_FIXED) {
                        count = pool.size();
                        slot.setQuestionCount(count);
                    } else if (pool.size() < count) {
                        throw new InsufficientQuestionsException(String.format(
                                "%s - Ô câu hỏi %d yêu cầu bốc %d câu từ nhóm đã chọn nhưng chỉ chọn %d câu.",
                                secTitle, slotIdx + 1, count, pool.size()
                        ));
                    }
                    if (subject == null && pool.get(0).getSubject() != null) {
                        subject = pool.get(0).getSubject();
                    }
                } else {
                    throw new IllegalArgumentException("Nguồn câu hỏi không hợp lệ: " + sourceType);
                }

                if (subject == null) {
                    subject = subjectRepository.findAll().stream().findFirst()
                            .orElseThrow(() -> new ResourceNotFoundException("Hệ thống chưa có môn học nào"));
                }

                ResolvedSlot rSlot = new ResolvedSlot();
                rSlot.sectionTitle = secTitle;
                rSlot.slotDto = slot;
                rSlot.subject = subject;
                rSlot.candidatePool = pool;
                rSlot.questionCount = count;
                rSlot.score = slot.getScore();
                result.add(rSlot);
            }
        }

        if (result.isEmpty()) {
            throw new IllegalArgumentException("Đề thi tốt nghiệp phải có ít nhất 1 ô câu hỏi");
        }
        return result;
    }

    private List<Question> resolveCommonSubjectQuestions(Subject subject, Set<Course> courses, Set<UUID> courseIdSet) {
        List<Question> subjectQuestions = questionRepository.findAll().stream()
                .filter(q -> {
                    try {
                        return q.getSubject() != null
                                && q.getSubject().getId().equals(subject.getId())
                                && Boolean.TRUE.equals(q.getIsActive());
                    } catch (Exception e) {
                        return false;
                    }
                })
                .collect(Collectors.toList());

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

    private Set<Course> resolveCourses(List<UUID> courseIds) {
        if (courseIds == null || courseIds.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một đối tượng dự thi");
        }
        List<Course> coursesList = courseRepository.findAllById(courseIds);
        if (coursesList.isEmpty()) {
            throw new ResourceNotFoundException("Đối tượng dự thi không tồn tại");
        }
        return new LinkedHashSet<>(coursesList);
    }

    private String resolveCourseCode(Set<Course> courses) {
        if (courses == null || courses.isEmpty()) return "DTT";
        return courses.stream()
                .map(Course::getCourseCode)
                .filter(Objects::nonNull)
                .sorted()
                .collect(Collectors.joining("-"));
    }

    private List<BlueprintSectionDto> normalizeAndEnrichSections(List<BlueprintSectionDto> rawSections) {
        if (rawSections == null || rawSections.isEmpty()) {
            throw new IllegalArgumentException("Cấu trúc đề phải có ít nhất một phần thi (Section)");
        }
        Map<UUID, String> subjectNameMap = subjectRepository.findAll().stream()
                .collect(Collectors.toMap(Subject::getId, Subject::getSubjectName, (a, b) -> a));

        List<BlueprintSectionDto> normalized = new ArrayList<>();
        for (int i = 0; i < rawSections.size(); i++) {
            BlueprintSectionDto sec = rawSections.get(i);
            UUID secSubjectId = sec.getSubjectId();
            String secSubjectName = secSubjectId != null ? subjectNameMap.get(secSubjectId) : sec.getSubjectName();

            List<BlueprintSlotDto> normSlots = new ArrayList<>();
            if (sec.getSlots() != null) {
                for (int j = 0; j < sec.getSlots().size(); j++) {
                    BlueprintSlotDto slot = sec.getSlots().get(j);
                    UUID slotSubId = slot.getSubjectId() != null ? slot.getSubjectId() : secSubjectId;
                    String slotSubName = slotSubId != null ? subjectNameMap.get(slotSubId) : slot.getSubjectName();
                    SlotSourceType st = slot.getSourceType() != null ? slot.getSourceType() : SlotSourceType.BANK_RANDOM;
                    int qCount = Math.max(1, slot.getQuestionCount());
                    if (st == SlotSourceType.BANK_FIXED && slot.getQuestionIds() != null && !slot.getQuestionIds().isEmpty()) {
                        qCount = slot.getQuestionIds().size();
                    }

                    normSlots.add(BlueprintSlotDto.builder()
                            .id(slot.getId() != null ? slot.getId() : UUID.randomUUID().toString())
                            .slotOrder(j + 1)
                            .sourceType(st)
                            .subjectId(slotSubId)
                            .subjectName(slotSubName)
                            .questionType(slot.getQuestionType())
                            .difficultyLevel(slot.getDifficultyLevel())
                            .questionCount(qCount)
                            .score(slot.getScore() != null ? slot.getScore() : 2.25)
                            .questionIds(slot.getQuestionIds() != null ? slot.getQuestionIds() : Collections.emptyList())
                            .build());
                }
            }

            normalized.add(BlueprintSectionDto.builder()
                    .id(sec.getId() != null ? sec.getId() : UUID.randomUUID().toString())
                    .sectionOrder(i + 1)
                    .title(sec.getTitle() != null && !sec.getTitle().isBlank() ? sec.getTitle().trim() : ("Phần " + (i + 1)))
                    .subjectId(secSubjectId)
                    .subjectName(secSubjectName)
                    .slots(normSlots)
                    .build());
        }
        return normalized;
    }

    private String serializeSections(List<BlueprintSectionDto> sections) {
        try {
            return objectMapper.writeValueAsString(sections);
        } catch (Exception e) {
            throw new IllegalArgumentException("Không thể lưu cấu trúc khung đề: " + e.getMessage());
        }
    }

    private List<BlueprintSectionDto> deserializeSections(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<BlueprintSectionDto>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private LocalDateTime parseExamDate(String examDateStr) {
        if (examDateStr == null || examDateStr.trim().isEmpty()) {
            return null;
        }
        try {
            String s = examDateStr.trim();
            if (s.length() == 10) {
                return LocalDate.parse(s).atStartOfDay();
            }
            return LocalDateTime.parse(s);
        } catch (Exception ignored) {
            return null;
        }
    }

    private int[] summarizeTypes(List<ResolvedSlot> resolvedSlots) {
        int numT = 0, numP = 0, numE = 0, numS = 0;
        for (ResolvedSlot rSlot : resolvedSlots) {
            QuestionType qt = rSlot.slotDto.getQuestionType();
            if (qt == null && !rSlot.candidatePool.isEmpty()) {
                qt = rSlot.candidatePool.get(0).getType();
            }
            int c = Math.max(1, rSlot.questionCount);
            if (qt == QuestionType.THUC_HANH) numP += c;
            else if (qt == QuestionType.TU_LUAN) numE += c;
            else if (qt == QuestionType.TINH_HUONG) numS += c;
            else numT += c;
        }
        return new int[]{numT, numP, numE, numS};
    }

    private String formatQuestionTypeLabel(QuestionType type) {
        if (type == null) return "Tất cả loại câu hỏi";
        return switch (type) {
            case LY_THUYET -> "Lý thuyết";
            case THUC_HANH -> "Thực hành";
            case TU_LUAN -> "Tự luận";
            case TINH_HUONG -> "Tình huống";
        };
    }
}

