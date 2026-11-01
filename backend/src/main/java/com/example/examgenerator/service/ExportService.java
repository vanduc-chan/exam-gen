package com.example.examgenerator.service;

import com.example.examgenerator.entity.Course;
import com.example.examgenerator.entity.Exam;
import com.example.examgenerator.entity.ExamDetail;
import com.example.examgenerator.entity.ExamQuestion;
import com.example.examgenerator.enumerate.ExamStatus;
import com.example.examgenerator.enumerate.QuestionType;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.repository.ExamDetailRepository;
import com.example.examgenerator.repository.ExamQuestionRepository;
import com.example.examgenerator.repository.ExamRepository;
import com.example.examgenerator.repository.SubjectRepository;
import com.example.examgenerator.entity.Subject;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import com.example.examgenerator.util.HtmlToWordRenderer;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final ExamRepository examRepository;
    private final ExamDetailRepository examDetailRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final SubjectRepository subjectRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public byte[] exportQuestionsZip(UUID examId) throws IOException {
        return exportZip(examId, false);
    }

    @Transactional
    public byte[] exportAnswersZip(UUID examId) throws IOException {
        return exportZip(examId, true);
    }

    private byte[] exportZip(UUID examId, boolean includeAnswers) throws IOException {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Đợt sinh đề không tồn tại"));

        List<ExamDetail> allDetails = examDetailRepository.findByExamId(examId);
        if (allDetails == null || allDetails.isEmpty()) {
            throw new IllegalArgumentException("Kỳ thi chưa có đề thi chi tiết để xuất file. Vui lòng sinh đề thi trước khi xuất!");
        }

        Map<Integer, List<ExamDetail>> batchMap = allDetails.stream()
                .collect(Collectors.groupingBy(d -> d.getBatchNumber() > 0 ? d.getBatchNumber() : 1));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            List<Integer> sortedBatches = batchMap.keySet().stream().sorted().collect(Collectors.toList());
            for (Integer batchNum : sortedBatches) {
                List<ExamDetail> details = batchMap.get(batchNum);
                details.sort(Comparator.comparingInt(ExamDetail::getOrderNumber));

                try (XWPFDocument document = new XWPFDocument()) {
                    if (includeAnswers) {
                        exportAnswerFile(document, exam, details, batchNum);
                    } else {
                        exportExamFile(document, exam, details, batchNum);
                    }

                    ByteArrayOutputStream docxOut = new ByteArrayOutputStream();
                    document.write(docxOut);

                    String prefix = includeAnswers ? "Dap_An" : "De_Thi";
                    String entryName = String.format("%s_Bo_De_%02d.docx", prefix, batchNum);
                    ZipEntry entry = new ZipEntry(entryName);
                    zos.putNextEntry(entry);
                    zos.write(docxOut.toByteArray());
                    zos.closeEntry();
                }
            }
        }

        exam.setStatus(ExamStatus.EXPORTED);
        examRepository.save(exam);

        return baos.toByteArray();
    }

    @Transactional
    public byte[] exportExamToWord(UUID examId, boolean includeAnswers) throws IOException {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Đợt sinh đề không tồn tại"));

        List<ExamDetail> details = examDetailRepository.findByExamId(examId);
        if (details == null || details.isEmpty()) {
            throw new IllegalArgumentException("Kỳ thi chưa có đề thi chi tiết để xuất file Word. Vui lòng sinh đề thi trước khi xuất!");
        }

        try (XWPFDocument document = new XWPFDocument()) {
            if (includeAnswers) {
                int batchNum = (details.get(0).getBatchNumber() > 0) ? details.get(0).getBatchNumber() : 1;
                exportAnswerFile(document, exam, details, batchNum);
            } else {
                int batchNum = (details.get(0).getBatchNumber() > 0) ? details.get(0).getBatchNumber() : 1;
                exportExamFile(document, exam, details, batchNum);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.write(out);

            // Update status to EXPORTED
            exam.setStatus(ExamStatus.EXPORTED);
            examRepository.save(exam);

            return out.toByteArray();
        }
    }

    /**
     * Export Exam File:
     * - Page 1: Cover Page (Bìa đề) with double page border.
     * - Section 2: Exam pages with 10mm margins on all sides.
     * - Exam distribution: max 4 exams per page, ensuring at least 1 exam is on the last page with signatures.
     */
    private List<ExamQuestion> getSortedQuestions(UUID detailId) {
        List<ExamQuestion> list = examQuestionRepository.findByExamDetailIdOrderByQuestionOrderAsc(detailId);
        if (list == null) {
            return Collections.emptyList();
        }
        List<ExamQuestion> sorted = new ArrayList<>(list);
        sorted.sort(Comparator.comparingInt(ExamQuestion::getQuestionOrder));
        return sorted;
    }

    private String resolveSubjectNameForCover(Exam exam, List<ExamDetail> details) {
        Set<String> distinctSubjects = new LinkedHashSet<>();
        if (details != null && !details.isEmpty()) {
            List<ExamQuestion> sampleQuestions = getSortedQuestions(details.get(0).getId());
            for (ExamQuestion eq : sampleQuestions) {
                try {
                    if (eq.getQuestion() != null && eq.getQuestion().getSubject() != null
                            && eq.getQuestion().getSubject().getSubjectName() != null) {
                        distinctSubjects.add(eq.getQuestion().getSubject().getSubjectName().trim());
                    }
                } catch (Exception ignored) {}
            }
        }
        if (distinctSubjects.size() > 1) {
            return String.join(", ", distinctSubjects);
        }
        if (exam.getSubject() != null && exam.getSubject().getSubjectName() != null) {
            return exam.getSubject().getSubjectName();
        }
        if (!distinctSubjects.isEmpty()) {
            return distinctSubjects.iterator().next();
        }
        return "Kỹ thuật Công binh";
    }

    Subject resolveFirstSubject(Exam exam, List<ExamDetail> details) {
        // 1. For graduation exams, try to extract the subject of the first section from blueprint snapshot
        if ("GRADUATION".equalsIgnoreCase(exam.getExamType()) && exam.getBlueprintSnapshot() != null
                && !exam.getBlueprintSnapshot().trim().isEmpty()) {
            UUID firstSectionSubjectId = extractFirstSubjectIdFromBlueprint(exam.getBlueprintSnapshot());
            if (firstSectionSubjectId != null) {
                Optional<Subject> subOpt = subjectRepository.findById(firstSectionSubjectId);
                if (subOpt.isPresent()) {
                    return subOpt.get();
                }
            }
        }

        // 2. Try from the first question of the exam details (sorted by questionOrder)
        if (details != null && !details.isEmpty()) {
            List<ExamQuestion> sampleQuestions = getSortedQuestions(details.get(0).getId());
            for (ExamQuestion eq : sampleQuestions) {
                try {
                    if (eq.getQuestion() != null && eq.getQuestion().getSubject() != null) {
                        return eq.getQuestion().getSubject();
                    }
                } catch (Exception ignored) {}
            }
        }

        // 3. Fallback to exam.getSubject()
        if (exam.getSubject() != null) {
            return exam.getSubject();
        }

        return null;
    }

    private UUID extractFirstSubjectIdFromBlueprint(String snapshot) {
        if (snapshot == null || snapshot.trim().isEmpty()) {
            return null;
        }
        try {
            List<Map<String, Object>> sections = objectMapper.readValue(
                    snapshot,
                    new TypeReference<List<Map<String, Object>>>() {}
            );
            if (sections != null && !sections.isEmpty()) {
                sections.sort((a, b) -> {
                    int o1 = a.get("sectionOrder") instanceof Number ? ((Number) a.get("sectionOrder")).intValue() : 0;
                    int o2 = b.get("sectionOrder") instanceof Number ? ((Number) b.get("sectionOrder")).intValue() : 0;
                    return Integer.compare(o1, o2);
                });
                for (Map<String, Object> sec : sections) {
                    Object sId = sec.get("subjectId");
                    if (sId != null && !sId.toString().trim().isEmpty()) {
                        return UUID.fromString(sId.toString().trim());
                    }
                    if (sec.get("slots") instanceof List) {
                        List<?> slots = (List<?>) sec.get("slots");
                        for (Object sl : slots) {
                            if (sl instanceof Map) {
                                Object slotSubId = ((Map<?, ?>) sl).get("subjectId");
                                if (slotSubId != null && !slotSubId.toString().trim().isEmpty()) {
                                    return UUID.fromString(slotSubId.toString().trim());
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract first subject from blueprint snapshot: {}", e.getMessage());
        }
        return null;
    }

    String resolveDepartmentNameForCover(Exam exam, List<ExamDetail> details) {
        Subject firstSubject = resolveFirstSubject(exam, details);
        if (firstSubject != null && firstSubject.getId() != null) {
            Optional<Subject> fullSubOpt = subjectRepository.findByIdWithDepartment(firstSubject.getId());
            if (fullSubOpt.isPresent()) {
                Subject s = fullSubOpt.get();
                if (s.getDepartmentGroup() != null && s.getDepartmentGroup().getDepartment() != null
                        && s.getDepartmentGroup().getDepartment().getName() != null) {
                    return formatDepartmentName(s.getDepartmentGroup().getDepartment().getName());
                }
            }
        }

        if (exam.getSubject() != null && exam.getSubject().getId() != null) {
            Optional<Subject> subOpt = subjectRepository.findByIdWithDepartment(exam.getSubject().getId());
            if (subOpt.isPresent()) {
                Subject s = subOpt.get();
                if (s.getDepartmentGroup() != null && s.getDepartmentGroup().getDepartment() != null
                        && s.getDepartmentGroup().getDepartment().getName() != null) {
                    return formatDepartmentName(s.getDepartmentGroup().getDepartment().getName());
                }
            }
        }

        return "KHOA BINH CHỦNG";
    }

    String formatDepartmentName(String rawName) {
        if (rawName == null || rawName.trim().isEmpty()) {
            return "KHOA BINH CHỦNG";
        }
        String upper = rawName.trim().toUpperCase();
        if (upper.startsWith("KHOA KHOA HỌC")) {
            return upper;
        }
        if (upper.startsWith("KHOA HỌC")) {
            return "KHOA " + upper;
        }
        if (upper.startsWith("KHOA ")) {
            return upper;
        }
        return "KHOA " + upper;
    }

    private void createCoverPage(XWPFDocument document, Exam exam, List<ExamDetail> details, boolean isAnswer, int batchNumber) {
        int currentYear = LocalDate.now().getYear();

        String deptName = resolveDepartmentNameForCover(exam, details);

        String courseName = "Đào tạo Tiểu đội trưởng Công binh";
        if (exam.getCourses() != null && !exam.getCourses().isEmpty()) {
            courseName = exam.getCourses().stream()
                    .map(Course::getName)
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining(", "));
        } else if (exam.getCourse() != null && exam.getCourse().getName() != null) {
            courseName = exam.getCourse().getName();
        }

        String subjectName = resolveSubjectNameForCover(exam, details);


        String rawTitle = (exam.getTitle() != null && !exam.getTitle().trim().isEmpty())
                ? exam.getTitle().toUpperCase()
                : (isAnswer ? "ĐÁP ÁN THI TỐT NGHIỆP" : "ĐỀ THI TỐT NGHIỆP");

        String title;
        if (isAnswer) {
            if (rawTitle.contains("ĐỀ THI")) {
                title = rawTitle.replace("ĐỀ THI", "ĐÁP ÁN");
            } else if (rawTitle.startsWith("THI ")) {
                title = "ĐÁP ÁN " + rawTitle;
            } else if (!rawTitle.contains("ĐÁP ÁN")) {
                title = "ĐÁP ÁN " + rawTitle;
            } else {
                title = rawTitle;
            }
        } else {
            title = rawTitle;
        }

        // Header Table (2 columns: School/Dept on left 4150 dxa, Motto on right 5488 dxa)
        XWPFTable headTable = document.createTable(1, 2);
        headTable.setWidth("100%");
        headTable.removeBorders();
        headTable.setTableAlignment(TableRowAlign.CENTER);

        CTTblPr tblPrHead = headTable.getCTTbl().getTblPr() != null ? headTable.getCTTbl().getTblPr() : headTable.getCTTbl().addNewTblPr();
        tblPrHead.addNewTblLayout().setType(STTblLayoutType.FIXED);
        CTTblWidth tblWHead = tblPrHead.getTblW() != null ? tblPrHead.getTblW() : tblPrHead.addNewTblW();
        tblWHead.setType(STTblWidth.DXA);
        tblWHead.setW(BigInteger.valueOf(9638));

        CTTblCellMar tblCellMarHead = tblPrHead.addNewTblCellMar();
        tblCellMarHead.addNewTop().setW(BigInteger.ZERO);
        tblCellMarHead.addNewBottom().setW(BigInteger.ZERO);
        tblCellMarHead.addNewLeft().setW(BigInteger.ZERO);
        tblCellMarHead.addNewRight().setW(BigInteger.ZERO);

        CTTblGrid tblGridHead = headTable.getCTTbl().addNewTblGrid();
        tblGridHead.addNewGridCol().setW(BigInteger.valueOf(4150));
        tblGridHead.addNewGridCol().setW(BigInteger.valueOf(5488));

        // Left cell: 4150 dxa (~73.2 mm)
        XWPFTableCell cLeft = headTable.getRow(0).getCell(0);
        cLeft.setWidth("4246");
        setCellZeroMargins(cLeft);

        XWPFParagraph p1 = cLeft.getParagraphArray(0);
        p1.setAlignment(ParagraphAlignment.CENTER);
        p1.setSpacingBefore(0);
        p1.setSpacingAfter(40);
        XWPFRun r1 = p1.createRun();
        r1.setFontFamily("Times New Roman");
        r1.setFontSize(13);
        r1.setText("TRƯỜNG QUÂN SỰ QUÂN KHU 3");

        XWPFParagraph p2 = cLeft.addParagraph();
        p2.setAlignment(ParagraphAlignment.CENTER);
        p2.setSpacingBefore(0);
        p2.setSpacingAfter(40);
        XWPFRun r2 = p2.createRun();
        r2.setFontFamily("Times New Roman");
        r2.setFontSize(13);
        r2.setBold(true);
        r2.setUnderline(UnderlinePatterns.SINGLE);
        r2.setText(deptName);

        // Right cell: 5488 dxa (~96.8 mm)
        XWPFTableCell cRight = headTable.getRow(0).getCell(1);
        cRight.setWidth("5488");
        setCellZeroMargins(cRight);

        XWPFParagraph p3 = cRight.getParagraphArray(0);
        p3.setAlignment(ParagraphAlignment.CENTER);
        p3.setSpacingBefore(0);
        p3.setSpacingAfter(40);
        XWPFRun r3 = p3.createRun();
        r3.setFontFamily("Times New Roman");
        r3.setFontSize(13);
        r3.setBold(true);
        r3.setText("CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM");

        XWPFParagraph p4 = cRight.addParagraph();
        p4.setAlignment(ParagraphAlignment.CENTER);
        p4.setSpacingBefore(0);
        p4.setSpacingAfter(40);
        XWPFRun r4 = p4.createRun();
        r4.setFontFamily("Times New Roman");
        r4.setFontSize(13);
        r4.setBold(true);
        r4.setUnderline(UnderlinePatterns.SINGLE);
        r4.setText("Độc lập - Tự do - Hạnh phúc");

        XWPFParagraph p5 = cRight.addParagraph();
        p5.setAlignment(ParagraphAlignment.CENTER);
        p5.setSpacingBefore(0);
        p5.setSpacingAfter(0);
        XWPFRun r5 = p5.createRun();
        r5.setFontFamily("Times New Roman");
        r5.setFontSize(13);
        r5.setItalic(true);
        r5.setText("Hải Phòng, ngày       tháng       năm " + currentYear);

        // Sub Table for "MẬT", "PHÊ DUYỆT" & "BỘ ĐỀ: XX"
        XWPFTable subTable = document.createTable(1, 2);
        subTable.setWidth("100%");
        subTable.removeBorders();
        subTable.setTableAlignment(TableRowAlign.CENTER);

        CTTblPr tblPrSub = subTable.getCTTbl().getTblPr() != null ? subTable.getCTTbl().getTblPr() : subTable.getCTTbl().addNewTblPr();
        tblPrSub.addNewTblLayout().setType(STTblLayoutType.FIXED);
        CTTblWidth tblWSub = tblPrSub.getTblW() != null ? tblPrSub.getTblW() : tblPrSub.addNewTblW();
        tblWSub.setType(STTblWidth.DXA);
        tblWSub.setW(BigInteger.valueOf(9638));

        CTTblCellMar tblCellMarSub = tblPrSub.addNewTblCellMar();
        tblCellMarSub.addNewTop().setW(BigInteger.ZERO);
        tblCellMarSub.addNewBottom().setW(BigInteger.ZERO);
        tblCellMarSub.addNewLeft().setW(BigInteger.ZERO);
        tblCellMarSub.addNewRight().setW(BigInteger.ZERO);

        CTTblGrid tblGridSub = subTable.getCTTbl().addNewTblGrid();
        tblGridSub.addNewGridCol().setW(BigInteger.valueOf(4150));
        tblGridSub.addNewGridCol().setW(BigInteger.valueOf(5488));

        XWPFTableCell subLeft = subTable.getRow(0).getCell(0);
        subLeft.setWidth("4150");
        setCellZeroMargins(subLeft);

        // Centered Box around just "MẬT": bordered paragraph with left and right indentation
        XWPFParagraph matP = subLeft.getParagraphArray(0);
        matP.setAlignment(ParagraphAlignment.CENTER);
        matP.setIndentationLeft(1375);
        matP.setIndentationRight(1375);
        matP.setSpacingBefore(40);
        matP.setSpacingAfter(40);
        matP.setBorderTop(Borders.SINGLE);
        matP.setBorderBottom(Borders.SINGLE);
        matP.setBorderLeft(Borders.SINGLE);
        matP.setBorderRight(Borders.SINGLE);
        XWPFRun matR = matP.createRun();
        matR.setFontFamily("Times New Roman");
        matR.setFontSize(12);
        matR.setBold(true);
        matR.setText("MẬT");

        XWPFParagraph pApprove = subLeft.addParagraph();
        pApprove.setAlignment(ParagraphAlignment.CENTER);
        pApprove.setSpacingBefore(200); // 10pt down from MẬT box
        pApprove.setSpacingAfter(30);
        XWPFRun rApprove = pApprove.createRun();
        rApprove.setFontFamily("Times New Roman");
        rApprove.setFontSize(13);
        rApprove.setBold(true);
        rApprove.setText("PHÊ DUYỆT");

        XWPFParagraph pDateApprove = subLeft.addParagraph();
        pDateApprove.setAlignment(ParagraphAlignment.CENTER);
        pDateApprove.setSpacingBefore(0);
        pDateApprove.setSpacingAfter(30);
        XWPFRun rDateApprove = pDateApprove.createRun();
        rDateApprove.setFontFamily("Times New Roman");
        rDateApprove.setFontSize(12);
        rDateApprove.setItalic(true);
        rDateApprove.setText("Ngày       tháng       năm " + currentYear);

        XWPFParagraph pPrincipal = subLeft.addParagraph();
        pPrincipal.setAlignment(ParagraphAlignment.CENTER);
        pPrincipal.setSpacingBefore(0);
        pPrincipal.setSpacingAfter(0);
        XWPFRun rPrincipal = pPrincipal.createRun();
        rPrincipal.setFontFamily("Times New Roman");
        rPrincipal.setFontSize(13);
        rPrincipal.setBold(true);
        rPrincipal.setText("HIỆU TRƯỞNG");

        XWPFTableCell subRight = subTable.getRow(0).getCell(1);
        subRight.setWidth("5488");
        setCellZeroMargins(subRight);

        XWPFParagraph pBatch = subRight.getParagraphArray(0);
        pBatch.setAlignment(ParagraphAlignment.CENTER);
        pBatch.setSpacingBefore(400); // Aligned horizontally with PHÊ DUYỆT
        XWPFRun rBatch = pBatch.createRun();
        rBatch.setFontFamily("Times New Roman");
        rBatch.setFontSize(14);
        rBatch.setBold(true);
        rBatch.setText("BỘ ĐỀ: " + String.format("%02d", Math.max(1, batchNumber)));

        // Vertical spacing before Exam Title - lowered down into the page
        XWPFParagraph pSpace1 = document.createParagraph();
        pSpace1.setSpacingBefore(2800); // ~140pt pushes Exam Title & Metadata down gracefully into page

        // Exam Title
        XWPFParagraph pTitle = document.createParagraph();
        pTitle.setAlignment(ParagraphAlignment.CENTER);
        pTitle.setSpacingAfter(350);
        XWPFRun rTitle = pTitle.createRun();
        rTitle.setFontFamily("Times New Roman");
        rTitle.setFontSize(20);
        rTitle.setBold(true);
        rTitle.setText(title);

        // Metadata block (Indented)
        addCoverMetadataLine(document, "Môn: " + subjectName);
        addCoverMetadataLine(document, "Đối tượng: " + courseName);
        String unitStr = (exam.getUnit() != null && !exam.getUnit().trim().isEmpty()) ? exam.getUnit().trim() : "Đại đội 10 - Tiểu đoàn 4";
        addCoverMetadataLine(document, "Đơn vị: " + unitStr);
        addCoverMetadataLine(document, "Năm học: " + currentYear);

        // Footer of Cover Page: "Hải Phòng, tháng       năm ...", chữ thường, KHÔNG in đậm, ở dưới cùng của trang bìa
        XWPFParagraph pCoverFooter = document.createParagraph();
        pCoverFooter.setAlignment(ParagraphAlignment.CENTER);
        pCoverFooter.setSpacingBefore(5000); // perfectly positions footer at bottom of cover page
        pCoverFooter.setSpacingAfter(0);
        XWPFRun rCoverFooter = pCoverFooter.createRun();
        rCoverFooter.setFontFamily("Times New Roman");
        rCoverFooter.setFontSize(13);
        rCoverFooter.setBold(false); // Chữ thường, KHÔNG in đậm
        rCoverFooter.setText("Hải Phòng, THÁNG       NĂM " + currentYear);

        // Section Break after Cover Page: Configure Section 1 (Cover) Page Borders & Margins
        XWPFParagraph pSectBreak = document.createParagraph();
        CTP ctp = pSectBreak.getCTP();
        CTPPr ppr = ctp.getPPr() != null ? ctp.getPPr() : ctp.addNewPPr();
        CTSectPr sectPrCover = ppr.addNewSectPr();

        CTPageSz szCover = sectPrCover.addNewPgSz();
        szCover.setW(BigInteger.valueOf(11906)); // A4 210mm
        szCover.setH(BigInteger.valueOf(16838)); // A4 297mm

        CTPageMar marCover = sectPrCover.addNewPgMar();
        marCover.setTop(BigInteger.valueOf(1417));    // 25mm
        marCover.setBottom(BigInteger.valueOf(1134)); // 20mm
        marCover.setLeft(BigInteger.valueOf(1417));   // 25mm
        marCover.setRight(BigInteger.valueOf(850));   // 15mm

        // Double Page Border on Cover Page (hugs the text margin, not overflowing page edge)
        CTPageBorders pgBordersCover = sectPrCover.addNewPgBorders();
        pgBordersCover.setOffsetFrom(STPageBorderOffset.TEXT);
        setupDoubleBorder(pgBordersCover.addNewTop());
        setupDoubleBorder(pgBordersCover.addNewBottom());
        setupDoubleBorder(pgBordersCover.addNewLeft());
        setupDoubleBorder(pgBordersCover.addNewRight());
    }

    private void createGradingRubricPage(XWPFDocument document, Exam exam, List<ExamDetail> details) {
        // Spacing before header
        XWPFParagraph pHeader = document.createParagraph();
        pHeader.setAlignment(ParagraphAlignment.CENTER);
        pHeader.setSpacingBefore(400); // ~20pt
        pHeader.setSpacingAfter(60);
        XWPFRun rHeader = pHeader.createRun();
        rHeader.setFontFamily("Times New Roman");
        rHeader.setFontSize(14);
        rHeader.setBold(true);
        rHeader.setText("THỐNG NHẤT BIỂU ĐIỂM");

        XWPFParagraph pSubHeader = document.createParagraph();
        pSubHeader.setAlignment(ParagraphAlignment.CENTER);
        pSubHeader.setSpacingBefore(0);
        pSubHeader.setSpacingAfter(400);
        XWPFRun rSubHeader = pSubHeader.createRun();
        rSubHeader.setFontFamily("Times New Roman");
        rSubHeader.setFontSize(13);
        rSubHeader.setItalic(true);
        rSubHeader.setText("Chấm theo thang điểm 10");

        // Inspect questions of first detail
        List<ExamQuestion> sampleQuestions = (details != null && !details.isEmpty())
                ? getSortedQuestions(details.get(0).getId())
                : Collections.emptyList();

        int qCount = Math.max(1, sampleQuestions.size());
        if (qCount == 2) {
            // Câu 1: 4,0 điểm
            XWPFParagraph pQ1 = document.createParagraph();
            pQ1.setAlignment(ParagraphAlignment.LEFT);
            pQ1.setSpacingBefore(120);
            pQ1.setSpacingAfter(40);
            XWPFRun rQ1 = pQ1.createRun();
            rQ1.setFontFamily("Times New Roman");
            rQ1.setFontSize(13);
            rQ1.setBold(true);
            rQ1.setText("Câu 1: 4,0 điểm");

            XWPFParagraph pQ1Desc = document.createParagraph();
            pQ1Desc.setAlignment(ParagraphAlignment.LEFT);
            pQ1Desc.setSpacingBefore(0);
            pQ1Desc.setSpacingAfter(180);
            XWPFRun rQ1Desc = pQ1Desc.createRun();
            rQ1Desc.setFontFamily("Times New Roman");
            rQ1Desc.setFontSize(13);
            rQ1Desc.setText("Trả lời đúng đủ nội dung, rõ ràng, hiểu bản chất.");

            // Câu 2: 5,0 điểm
            XWPFParagraph pQ2 = document.createParagraph();
            pQ2.setAlignment(ParagraphAlignment.LEFT);
            pQ2.setSpacingBefore(120);
            pQ2.setSpacingAfter(40);
            XWPFRun rQ2 = pQ2.createRun();
            rQ2.setFontFamily("Times New Roman");
            rQ2.setFontSize(13);
            rQ2.setBold(true);
            rQ2.setText("Câu 2: 5,0 điểm");

            XWPFParagraph pQ2Desc = document.createParagraph();
            pQ2Desc.setAlignment(ParagraphAlignment.LEFT);
            pQ2Desc.setSpacingBefore(0);
            pQ2Desc.setSpacingAfter(180);
            XWPFRun rQ2Desc = pQ2Desc.createRun();
            rQ2Desc.setFontFamily("Times New Roman");
            rQ2Desc.setFontSize(13);
            rQ2Desc.setText("Khẩu lệnh to, rõ, đúng đủ nội dung. Tác phong chỉ huy tốt.");
        } else {
            // General case for N questions: distribute 9.0 points among N questions + 1 point conduct
            double baseScore = Math.floor((9.0 / qCount) * 10) / 10.0;
            double remainder = Math.round((9.0 - (baseScore * qCount)) * 10.0) / 10.0;

            for (int i = 0; i < qCount; i++) {
                ExamQuestion eq = sampleQuestions.get(i);
                double score = baseScore + (i == 0 ? remainder : 0.0);
                if (eq.getScore() != null && eq.getScore() > 0) {
                    score = eq.getScore();
                }

                XWPFParagraph pQ = document.createParagraph();
                pQ.setAlignment(ParagraphAlignment.LEFT);
                pQ.setSpacingBefore(120);
                pQ.setSpacingAfter(40);
                XWPFRun rQ = pQ.createRun();
                rQ.setFontFamily("Times New Roman");
                rQ.setFontSize(13);
                rQ.setBold(true);
                rQ.setText("Câu " + (i + 1) + ": " + String.format(java.util.Locale.US, "%.1f", score).replace(".", ",") + " điểm");

                XWPFParagraph pQDesc = document.createParagraph();
                pQDesc.setAlignment(ParagraphAlignment.LEFT);
                pQDesc.setSpacingBefore(0);
                pQDesc.setSpacingAfter(180);
                XWPFRun rQDesc = pQDesc.createRun();
                rQDesc.setFontFamily("Times New Roman");
                rQDesc.setFontSize(13);

                QuestionType type = eq.getQuestion() != null ? eq.getQuestion().getType() : QuestionType.LY_THUYET;
                if (type == QuestionType.THUC_HANH) {
                    rQDesc.setText("Khẩu lệnh to, rõ, đúng đủ nội dung. Tác phong chỉ huy tốt.");
                } else if (type == QuestionType.TU_LUAN) {
                    rQDesc.setText("Phân tích logic, liên hệ thực tiễn chặt chẽ.");
                } else if (type == QuestionType.TINH_HUONG) {
                    rQDesc.setText("Xử trí nhanh, chính xác, đúng nguyên tắc chiến thuật.");
                } else {
                    rQDesc.setText("Trả lời đúng đủ nội dung, rõ ràng, hiểu bản chất.");
                }
            }
        }

        // Lễ tiết tác phong: 01 điểm
        XWPFParagraph pConduct = document.createParagraph();
        pConduct.setAlignment(ParagraphAlignment.LEFT);
        pConduct.setSpacingBefore(120);
        pConduct.setSpacingAfter(180);
        XWPFRun rConduct = pConduct.createRun();
        rConduct.setFontFamily("Times New Roman");
        rConduct.setFontSize(13);
        rConduct.setBold(true);
        rConduct.setText("Lễ tiết tác phong: 01 điểm");

        // Section Break after Rubric Page: standard 20mm/25mm margins without border
        XWPFParagraph pSectBreak = document.createParagraph();
        CTP ctp = pSectBreak.getCTP();
        CTPPr ppr = ctp.getPPr() != null ? ctp.getPPr() : ctp.addNewPPr();
        CTSectPr sectPrRubric = ppr.addNewSectPr();

        CTPageSz szRubric = sectPrRubric.addNewPgSz();
        szRubric.setW(BigInteger.valueOf(11906));
        szRubric.setH(BigInteger.valueOf(16838));

        CTPageMar marRubric = sectPrRubric.addNewPgMar();
        marRubric.setTop(BigInteger.valueOf(1417));    // 25mm
        marRubric.setBottom(BigInteger.valueOf(1134)); // 20mm
        marRubric.setLeft(BigInteger.valueOf(1417));   // 25mm
        marRubric.setRight(BigInteger.valueOf(850));   // 15mm

        CTPageBorders pgBordersRubric = sectPrRubric.addNewPgBorders();
        pgBordersRubric.setOffsetFrom(STPageBorderOffset.TEXT);
        pgBordersRubric.addNewTop().setVal(STBorder.NONE);
        pgBordersRubric.addNewBottom().setVal(STBorder.NONE);
        pgBordersRubric.addNewLeft().setVal(STBorder.NONE);
        pgBordersRubric.addNewRight().setVal(STBorder.NONE);
    }

    private void exportExamFile(XWPFDocument document, Exam exam, List<ExamDetail> details, int batchNumber) {
        int currentYear = LocalDate.now().getYear();
        int currentMonth = LocalDate.now().getMonthValue();

        String courseName = "Đào tạo Tiểu đội trưởng Công binh";
        if (exam.getCourses() != null && !exam.getCourses().isEmpty()) {
            courseName = exam.getCourses().stream()
                    .map(Course::getName)
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining(", "));
        } else if (exam.getCourse() != null && exam.getCourse().getName() != null) {
            courseName = exam.getCourse().getName();
        }

        String subjectName = "Kỹ thuật Công binh";
        if (exam.getSubject() != null && exam.getSubject().getSubjectName() != null) {
            subjectName = exam.getSubject().getSubjectName();
        }

        // 1. COVER PAGE (BÌA ĐỀ)
        createCoverPage(document, exam, details, false, batchNumber);

        // ==========================================
        // 2. EXAM PAGES (TRANG ĐỀ THI)
        // ==========================================
        Map<UUID, List<ExamQuestion>> questionsMap = new HashMap<>();
        for (ExamDetail d : details) {
            questionsMap.put(d.getId(), getSortedQuestions(d.getId()));
        }

        // Responsive distribution of exams: 4, 3, or 2 exams per page depending on question count & length,
        // ensuring at least 1 exam is on the last page with signatures.
        int maxPerPage = determineMaxExamsPerPage(details, questionsMap);
        List<Integer> distribution = calculatePageDistribution(details.size(), maxPerPage);

        // Find the maximum estimated question lines across all exams in this batch
        // to set a uniform border frame height across all exams for straight, clean cutting lines
        int maxLinesInBatch = 0;
        for (ExamDetail d : details) {
            List<ExamQuestion> qs = questionsMap.getOrDefault(d.getId(), Collections.emptyList());
            int lines = estimateExamLines(qs);
            if (lines > maxLinesInBatch) {
                maxLinesInBatch = lines;
            }
        }
        long uniformBoxHeightDxa = calculateUniformExamBoxHeight(maxPerPage, maxLinesInBatch);

        int currentDetailIdx = 0;
        for (int pageIdx = 0; pageIdx < distribution.size(); pageIdx++) {
            int countInPage = distribution.get(pageIdx);
            boolean isLastPage = (pageIdx == distribution.size() - 1);

            if (pageIdx > 0) {
                XWPFParagraph pPageBreak = document.createParagraph();
                XWPFRun rBreak = pPageBreak.createRun();
                rBreak.addBreak(BreakType.PAGE);
            }

            for (int eNum = 0; eNum < countInPage; eNum++) {
                if (currentDetailIdx >= details.size()) break;
                ExamDetail detail = details.get(currentDetailIdx);
                List<ExamQuestion> questions = questionsMap.getOrDefault(detail.getId(), Collections.emptyList());

                // Exam Box with Double Border: 100% full width, identical height across all frames
                XWPFTable examTable = document.createTable(1, 1);
                examTable.setWidth("100%");
                examTable.setTableAlignment(TableRowAlign.CENTER);
                examTable.getRow(0).setCantSplitRow(true);

                CTTblPr tblPrEx = examTable.getCTTbl().getTblPr() != null ? examTable.getCTTbl().getTblPr() : examTable.getCTTbl().addNewTblPr();
                CTTblWidth tblWEx = tblPrEx.getTblW() != null ? tblPrEx.getTblW() : tblPrEx.addNewTblW();
                tblWEx.setType(STTblWidth.DXA);
                tblWEx.setW(BigInteger.valueOf(10772)); // 190mm (full printable width on 10mm margins)

                // Uniform height across all exam frames based on the longest exam in the batch
                CTTrPr trPrEx = examTable.getRow(0).getCtRow().getTrPr() != null ? examTable.getRow(0).getCtRow().getTrPr() : examTable.getRow(0).getCtRow().addNewTrPr();
                CTHeight hEx = trPrEx.addNewTrHeight();
                hEx.setVal(BigInteger.valueOf(uniformBoxHeightDxa));
                hEx.setHRule(STHeightRule.AT_LEAST);

                examTable.setTopBorder(XWPFTable.XWPFBorderType.DOUBLE, 12, 0, "000000");
                examTable.setBottomBorder(XWPFTable.XWPFBorderType.DOUBLE, 12, 0, "000000");
                examTable.setLeftBorder(XWPFTable.XWPFBorderType.DOUBLE, 12, 0, "000000");
                examTable.setRightBorder(XWPFTable.XWPFBorderType.DOUBLE, 12, 0, "000000");

                XWPFTableCell cell = examTable.getRow(0).getCell(0);
                cell.setWidth("10772");
                CTTcPr tcPrEx = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
                CTTblWidth tcWEx = tcPrEx.isSetTcW() ? tcPrEx.getTcW() : tcPrEx.addNewTcW();
                tcWEx.setType(STTblWidth.DXA);
                tcWEx.setW(BigInteger.valueOf(10772));

                // Header: ĐỀ SỐ XX
                XWPFParagraph header = cell.getParagraphArray(0);
                header.setAlignment(ParagraphAlignment.CENTER);
                header.setSpacingBefore(20);
                header.setSpacingAfter(40);
                XWPFRun runHeader = header.createRun();
                runHeader.setBold(true);
                runHeader.setFontFamily("Times New Roman");
                runHeader.setFontSize(13);
                int orderNum = (detail.getOrderNumber() > 0) ? detail.getOrderNumber() : (currentDetailIdx + 1);
                runHeader.setText("ĐỀ SỐ " + String.format("%02d", orderNum));

                for (int qIdx = 0; qIdx < questions.size(); qIdx++) {
                    ExamQuestion eq = questions.get(qIdx);
                    String contentStr = (eq.getQuestion() != null && eq.getQuestion().getContent() != null) ? eq.getQuestion().getContent() : "";
                    HtmlToWordRenderer.renderToCell(cell, "Câu " + (qIdx + 1) + ": ", contentStr, "Times New Roman", 13);
                }

                currentDetailIdx++;

                // Between exams on the same page: generate dashed cut line so users can cut each exam slip
                if (eNum < countInPage - 1 && currentDetailIdx < details.size()) {
                    XWPFParagraph cutPara = document.createParagraph();
                    cutPara.setAlignment(ParagraphAlignment.CENTER);
                    cutPara.setSpacingBefore(20);
                    cutPara.setSpacingAfter(20);
                    // cutPara.setBorderBottom(Borders.DASHED);

                    // XWPFRun cutRun = cutPara.createRun();
                    // cutRun.setFontFamily("Times New Roman");
                    // cutRun.setFontSize(9);
                    // cutRun.setItalic(true);
                    // cutRun.setColor("777777");
                    // cutRun.setText("✂ - - - - - - - - - - - - - - - - - - (Cắt tại đây) - - - - - - - - - - - - - - - - - - ✂");
                } else {
                    // Intervening spacer paragraph (prevents Word table merging and provides clean spacing)
                    XWPFParagraph sep = document.createParagraph();
                    sep.setSpacingBefore(0);
                    sep.setSpacingAfter(40);
                }
            }

            // On the last page: append Signatures & Exam Metadata Table
            if (isLastPage) {
                XWPFTable sigTable = document.createTable(1, 2);
                sigTable.setWidth("100%");
                sigTable.removeBorders();
                sigTable.setTableAlignment(TableRowAlign.CENTER);
                sigTable.getRow(0).setCantSplitRow(true);

                CTTblPr tblPrSig = sigTable.getCTTbl().getTblPr() != null ? sigTable.getCTTbl().getTblPr() : sigTable.getCTTbl().addNewTblPr();
                CTTblWidth tblWSig = tblPrSig.getTblW() != null ? tblPrSig.getTblW() : tblPrSig.addNewTblW();
                tblWSig.setType(STTblWidth.DXA);
                tblWSig.setW(BigInteger.valueOf(10772));

                // Left cell: Red italic exam metadata
                XWPFTableCell sigLeft = sigTable.getRow(0).getCell(0);
                sigLeft.setWidth("5386");
                setCellZeroMargins(sigLeft);

                XWPFParagraph pTarget = sigLeft.getParagraphArray(0);
                pTarget.setSpacingBefore(120);
                pTarget.setSpacingAfter(20);
                XWPFRun rTargetLbl = pTarget.createRun();
                rTargetLbl.setFontFamily("Times New Roman");
                rTargetLbl.setFontSize(12);
                rTargetLbl.setBold(true);
                rTargetLbl.setItalic(true);
                rTargetLbl.setColor("FF0000");
                rTargetLbl.setText("- Đối tượng: ");

                XWPFRun rTargetVal = pTarget.createRun();
                rTargetVal.setFontFamily("Times New Roman");
                rTargetVal.setFontSize(12);
                rTargetVal.setItalic(true);
                rTargetVal.setColor("FF0000");
                rTargetVal.setText(courseName + ";");

                String unitAbbr = formatMilitaryUnitAbbreviation(exam.getUnit());
                addRedItalicLine(sigLeft, "- Đơn vị: " + unitAbbr + ";");
                addRedItalicLine(sigLeft, "- Số lượng: " + String.format("%02d bộ;", Math.max(1, exam.getNumberOfExams())));

                String examDateSig;
                if (exam.getExamDate() != null) {
                    examDateSig = "- Ngày thi: " + exam.getExamDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                } else {
                    examDateSig = "- Ngày thi:      /" + String.format("%02d", currentMonth) + "/" + currentYear;
                }
                addRedItalicLine(sigLeft, examDateSig);

                // Right cell: Signatures
                XWPFTableCell sigRight = sigTable.getRow(0).getCell(1);
                sigRight.setWidth("5386");
                setCellZeroMargins(sigRight);

                XWPFParagraph pSigDate = sigRight.getParagraphArray(0);
                pSigDate.setAlignment(ParagraphAlignment.CENTER);
                pSigDate.setSpacingBefore(120);
                pSigDate.setSpacingAfter(20);
                XWPFRun rSigDate = pSigDate.createRun();
                rSigDate.setFontFamily("Times New Roman");
                rSigDate.setFontSize(13);
                rSigDate.setItalic(true);
                rSigDate.setText("Ngày       tháng     năm " + currentYear);

                XWPFParagraph pAuthor = sigRight.addParagraph();
                pAuthor.setAlignment(ParagraphAlignment.CENTER);
                pAuthor.setSpacingBefore(0);
                pAuthor.setSpacingAfter(450); // blank space for signature
                XWPFRun rAuthor = pAuthor.createRun();
                rAuthor.setFontFamily("Times New Roman");
                rAuthor.setFontSize(13);
                rAuthor.setBold(true);
                rAuthor.setText("NGƯỜI BIÊN SOẠN");

                XWPFParagraph pDean = sigRight.addParagraph();
                pDean.setAlignment(ParagraphAlignment.CENTER);
                pDean.setSpacingBefore(0);
                pDean.setSpacingAfter(30);
                XWPFRun rDean = pDean.createRun();
                rDean.setFontFamily("Times New Roman");
                rDean.setFontSize(13);
                rDean.setBold(true);
                rDean.setText("TRƯỜNG KHOA");

                XWPFParagraph pDeanName = sigRight.addParagraph();
                pDeanName.setAlignment(ParagraphAlignment.CENTER);
                pDeanName.setSpacingBefore(0);
                pDeanName.setSpacingAfter(0);
                XWPFRun rDeanName = pDeanName.createRun();
                rDeanName.setFontFamily("Times New Roman");
                rDeanName.setFontSize(13);
                rDeanName.setBold(true);
                rDeanName.setText("Đại tá Phạm Văn Thể");
            }
        }

        // Section 2 Document Body Configuration (10mm margins on all sides, NO page borders)
        CTSectPr bodySectPr = document.getDocument().getBody().isSetSectPr()
                ? document.getDocument().getBody().getSectPr()
                : document.getDocument().getBody().addNewSectPr();

        CTPageSz szExam = bodySectPr.addNewPgSz();
        szExam.setW(BigInteger.valueOf(11906));
        szExam.setH(BigInteger.valueOf(16838));

        CTPageMar marExam = bodySectPr.addNewPgMar();
        marExam.setTop(BigInteger.valueOf(567));    // 10mm
        marExam.setBottom(BigInteger.valueOf(567)); // 10mm
        marExam.setLeft(BigInteger.valueOf(567));   // 10mm
        marExam.setRight(BigInteger.valueOf(567));  // 10mm

        CTPageBorders pgBordersExam = bodySectPr.addNewPgBorders();
        pgBordersExam.setOffsetFrom(STPageBorderOffset.TEXT);
        pgBordersExam.addNewTop().setVal(STBorder.NONE);
        pgBordersExam.addNewBottom().setVal(STBorder.NONE);
        pgBordersExam.addNewLeft().setVal(STBorder.NONE);
        pgBordersExam.addNewRight().setVal(STBorder.NONE);
    }

    /**
     * Export Answer File with answer guidelines for each question.
     */
    private void exportAnswerFile(XWPFDocument document, Exam exam, List<ExamDetail> details, int batchNumber) {
        // 1. Cover Page for Answer file
        createCoverPage(document, exam, details, true, batchNumber);

        // 2. Grading Rubric (THỐNG NHẤT BIỂU ĐIỂM)
        createGradingRubricPage(document, exam, details);

        // 3. Answer Content for each Exam Set
        for (int dIndex = 0; dIndex < details.size(); dIndex++) {
            ExamDetail detail = details.get(dIndex);
            List<ExamQuestion> questions = getSortedQuestions(detail.getId());

            if (dIndex > 0) {
                // Xuống dòng cách 1 khoảng giữa các đề ở file đáp án
                XWPFParagraph spacer = document.createParagraph();
                spacer.setSpacingBefore(60);
                spacer.setSpacingAfter(60);
            }

            XWPFParagraph header = document.createParagraph();
            header.setAlignment(ParagraphAlignment.CENTER);
            header.setSpacingBefore(120);
            header.setSpacingAfter(100);
            XWPFRun runHeader = header.createRun();
            runHeader.setBold(true);
            runHeader.setFontFamily("Times New Roman");
            runHeader.setFontSize(13);
            int orderNum = (detail.getOrderNumber() > 0) ? detail.getOrderNumber() : (dIndex + 1);
            runHeader.setText("ĐỀ SỐ " + String.format("%02d", orderNum));

            for (int i = 0; i < questions.size(); i++) {
                ExamQuestion eq = questions.get(i);
                String contentStr = (eq.getQuestion() != null && eq.getQuestion().getContent() != null) ? eq.getQuestion().getContent() : "";
                HtmlToWordRenderer.renderQuestionToDocument(
                        document,
                        "Câu " + (i + 1) + ": ",
                        contentStr,
                        "Times New Roman",
                        13,
                        true // withTabIndent = true (1 dấu tab lùi đầu dòng cho mỗi câu hỏi)
                );

                // "ĐÁP ÁN" Header
                XWPFParagraph ansHeader = document.createParagraph();
                ansHeader.setAlignment(ParagraphAlignment.CENTER);
                ansHeader.setSpacingBefore(60);
                ansHeader.setSpacingAfter(60);
                XWPFRun runAnsHeader = ansHeader.createRun();
                runAnsHeader.setBold(true);
                runAnsHeader.setFontFamily("Times New Roman");
                runAnsHeader.setFontSize(13);
                runAnsHeader.setText("ĐÁP ÁN");

                if (eq.getQuestion() != null && eq.getQuestion().getAnswer() != null && !eq.getQuestion().getAnswer().trim().isEmpty()) {
                    HtmlToWordRenderer.renderToDocument(document, eq.getQuestion().getAnswer(), "Times New Roman", 13);
                }
            }
        }

        // Section 3 (Answers): Margins 10mm without borders
        CTBody body = document.getDocument().getBody();
        CTSectPr bodySectPr = body.isSetSectPr() ? body.getSectPr() : body.addNewSectPr();

        CTPageSz szAns = bodySectPr.addNewPgSz();
        szAns.setW(BigInteger.valueOf(11906));
        szAns.setH(BigInteger.valueOf(16838));

        CTPageMar marAns = bodySectPr.addNewPgMar();
        marAns.setTop(BigInteger.valueOf(1417));    // 25mm
        marAns.setBottom(BigInteger.valueOf(1134)); // 20mm
        marAns.setLeft(BigInteger.valueOf(1417));   // 25mm
        marAns.setRight(BigInteger.valueOf(850));   // 15mm

        CTPageBorders pgBordersAns = bodySectPr.addNewPgBorders();
        pgBordersAns.setOffsetFrom(STPageBorderOffset.TEXT);
        pgBordersAns.addNewTop().setVal(STBorder.NONE);
        pgBordersAns.addNewBottom().setVal(STBorder.NONE);
        pgBordersAns.addNewLeft().setVal(STBorder.NONE);
        pgBordersAns.addNewRight().setVal(STBorder.NONE);
    }

    /**
     * Estimate the number of visual text lines for an exam's questions on a 190mm wide cell (13pt bold font).
     */
    public int estimateExamLines(List<ExamQuestion> questions) {
        if (questions == null || questions.isEmpty()) {
            return 1;
        }
        double totalLines = 0.0;
        for (ExamQuestion eq : questions) {
            String rawHtml = (eq.getQuestion() != null && eq.getQuestion().getContent() != null)
                    ? eq.getQuestion().getContent()
                    : "";
            String normalized = rawHtml
                    .replaceAll("(?i)<br\s*/?>", "\n")
                    .replaceAll("(?i)</(p|div|li|tr)>", "\n")
                    .replaceAll("<[^>]+>", "")
                    .replace("&nbsp;", " ")
                    .replace("&amp;", "&")
                    .replace("&lt;", "<")
                    .replace("&gt;", ">")
                    .trim();
            if (normalized.isEmpty()) {
                totalLines += 1.0;
                continue;
            }
            String[] paragraphs = normalized.split("\r?\n");
            int nonEmptyCount = 0;
            for (int idx = 0; idx < paragraphs.length; idx++) {
                String p = paragraphs[idx].trim();
                if (p.isEmpty()) continue;
                nonEmptyCount++;
                // First paragraph of a question includes "Câu X: " + 1 tab indent (~12 chars)
                int effectiveChars = p.length() + (nonEmptyCount == 1 ? 12 : 4);
                int wrappedLines = Math.max(1, (int) Math.ceil(effectiveChars / 75.0));
                totalLines += wrappedLines;
            }
            if (nonEmptyCount == 0) {
                totalLines += 1.0;
            }
            // Account for paragraph spacing before/after each question
            totalLines += 0.35;
        }
        return (int) Math.ceil(totalLines);
    }

    /**
     * Dynamically determine the maximum number of exams per page (4, 3, or 2)
     * so that exams never overflow the page and trigger an unintended double page break.
     */
    public int determineMaxExamsPerPage(List<ExamDetail> details, Map<UUID, List<ExamQuestion>> questionsMap) {
        if (details == null || details.isEmpty()) {
            return 4;
        }
        int maxQuestionCount = 0;
        int maxEstimatedLines = 0;

        for (ExamDetail detail : details) {
            List<ExamQuestion> qs = questionsMap != null
                    ? questionsMap.getOrDefault(detail.getId(), Collections.emptyList())
                    : getSortedQuestions(detail.getId());
            if (qs.size() > maxQuestionCount) {
                maxQuestionCount = qs.size();
            }
            int lines = estimateExamLines(qs);
            if (lines > maxEstimatedLines) {
                maxEstimatedLines = lines;
            }
        }

        // If an exam has >= 5 questions or > 11 visual lines of question text -> 2 exams per page
        if (maxQuestionCount >= 5 || maxEstimatedLines > 11) {
            return 2;
        }
        // If an exam has 3-4 questions or > 6 visual lines of question text -> 3 exams per page
        if (maxQuestionCount >= 3 || maxEstimatedLines > 6) {
            return 3;
        }
        // Standard short 1-2 question exams (<= 6 visual lines) -> 4 exams per page
        return 4;
    }

    /**
     * Calculate a consistent, uniform border box height across all exams in the batch
     * based on the longest exam frame (so all exam slips align perfectly for easy cutting).
     */
    public long calculateUniformExamBoxHeight(int maxPerPage, int maxLinesInBatch) {
        // Base minimum heights for aesthetic layout
        long baseMin = (maxPerPage == 4) ? 3100L : (maxPerPage == 3 ? 3400L : 4200L);

        // Header (ĐỀ SỐ XX) + margins ~ 650 dxa; each visual line of 13pt bold text ~ 270 dxa
        long contentHeight = 650L + (long) maxLinesInBatch * 270L;
        long uniformHeight = Math.max(baseMin, contentHeight);

        // Maximum safe height per exam box to prevent exceeding printable page height (15704 dxa)
        // Leaving 200 dxa per cut line/spacer between exams + 100 dxa safety buffer
        long maxSafeHeight = (15704L - (long) (maxPerPage - 1) * 200L - 100L) / (long) maxPerPage;

        return Math.min(uniformHeight, maxSafeHeight);
    }

    /**
     * Calculate distribution of exams across pages (defaulting to 4 exams per page).
     */
    public List<Integer> calculatePageDistribution(int totalExams) {
        return calculatePageDistribution(totalExams, 4);
    }

    /**
     * Calculate responsive distribution of exams across pages:
     * - Max `maxPerPage` (4, 3, or 2) exams per page without signatures.
     * - The final page with signatures MUST have at least 1 exam, and at most `maxPerPage - 1` exams.
     * - Examples:
     *   - maxPerPage = 4, totalExams = 12 -> [4, 4, 3, 1]
     *   - maxPerPage = 3, totalExams = 12 -> [3, 3, 3, 2, 1]
     *   - maxPerPage = 3, totalExams = 20 -> [3, 3, 3, 3, 3, 3, 2]
     *   - maxPerPage = 2, totalExams = 6  -> [2, 2, 1, 1]
     */
    public List<Integer> calculatePageDistribution(int totalExams, int maxPerPage) {
        List<Integer> pages = new ArrayList<>();
        if (totalExams <= 0) {
            return pages;
        }
        int safeMax = Math.max(2, Math.min(4, maxPerPage));
        int maxLastPage = Math.max(1, safeMax - 1);

        if (totalExams <= maxLastPage) {
            pages.add(totalExams);
            return pages;
        }

        int fullPages = totalExams / safeMax;
        int rem = totalExams % safeMax;

        if (rem == 0) {
            // Move 1 exam from the previous page to the last page so the last page has 1 exam + signatures
            for (int i = 0; i < fullPages - 1; i++) {
                pages.add(safeMax);
            }
            pages.add(maxLastPage);
            pages.add(1);
        } else {
            // rem is guaranteed to be between 1 and maxLastPage (inclusive)
            for (int i = 0; i < fullPages; i++) {
                pages.add(safeMax);
            }
            pages.add(rem);
        }
        return pages;
    }

    private void addCoverMetadataLine(XWPFDocument document, String text) {
        XWPFParagraph p = document.createParagraph();
        p.setIndentationLeft(1700); // ~30mm
        p.setSpacingAfter(120);
        XWPFRun r = p.createRun();
        r.setFontFamily("Times New Roman");
        r.setFontSize(13);
        r.setBold(true);
        r.setText(text);
    }

    private void addRedItalicLine(XWPFTableCell cell, String text) {
        XWPFParagraph p = cell.addParagraph();
        p.setSpacingAfter(30);
        XWPFRun r = p.createRun();
        r.setFontFamily("Times New Roman");
        r.setFontSize(12);
        r.setItalic(true);
        r.setColor("FF0000");
        r.setText(text);
    }

    private void setupDoubleBorder(CTBorder border) {
        border.setVal(STBorder.DOUBLE);
        border.setSz(BigInteger.valueOf(12));
        border.setSpace(BigInteger.valueOf(10));
        border.setColor("000000");
    }

    private void setCellZeroMargins(XWPFTableCell cell) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
        CTTcMar tcMar = tcPr.isSetTcMar() ? tcPr.getTcMar() : tcPr.addNewTcMar();
        if (tcMar.isSetTop()) tcMar.getTop().setW(BigInteger.ZERO); else tcMar.addNewTop().setW(BigInteger.ZERO);
        if (tcMar.isSetBottom()) tcMar.getBottom().setW(BigInteger.ZERO); else tcMar.addNewBottom().setW(BigInteger.ZERO);
        if (tcMar.isSetLeft()) tcMar.getLeft().setW(BigInteger.ZERO); else tcMar.addNewLeft().setW(BigInteger.ZERO);
        if (tcMar.isSetRight()) tcMar.getRight().setW(BigInteger.ZERO); else tcMar.addNewRight().setW(BigInteger.ZERO);
    }

    /**
     * Converts a military unit string (e.g. "Đại đội 10 - Tiểu đoàn 4") into its standard military abbreviation
     * (e.g. "c10/d4"). Rules:
     * - Đại đội (đđ/c) -> c + number
     * - Tiểu đoàn (tđ/d) -> d + number
     * - Trung đội (b) -> b + number
     * - Output order: c / d
     */
    public static String formatMilitaryUnitAbbreviation(String unit) {
        if (unit == null || unit.trim().isEmpty()) {
            return "";
        }
        String s = unit.trim();
        if (s.matches("(?i)^[a-z]\\d+(/[a-z]\\d+)*$")) {
            return s.toLowerCase();
        }

        // Chuyển s về chữ thường để khớp hoàn toàn với các từ khóa tiếng Việt không dấu/có dấu ở dạng thường
        String sLower = s.toLowerCase();

        java.util.regex.Matcher mC = java.util.regex.Pattern.compile("(?:đại đội|đđ|c)\\s*(\\d+)").matcher(sLower);
        java.util.regex.Matcher mD = java.util.regex.Pattern.compile("(?:tiểu đoàn|tđ|d)\\s*(\\d+)").matcher(sLower);
        java.util.regex.Matcher mB = java.util.regex.Pattern.compile("(?:trung đội|b)\\s*(\\d+)").matcher(sLower);

        String bPart = mB.find() ? "b" + mB.group(1) : null;
        String cPart = mC.find() ? "c" + mC.group(1) : null;
        String dPart = mD.find() ? "d" + mD.group(1) : null;

        List<String> parts = new ArrayList<>();
        if (bPart != null) parts.add(bPart);
        if (cPart != null) parts.add(cPart);
        if (dPart != null) parts.add(dPart);

        if (!parts.isEmpty()) {
            return String.join("/", parts);
        }
        return s;
    }
}
