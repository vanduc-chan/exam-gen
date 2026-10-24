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
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final ExamRepository examRepository;
    private final ExamDetailRepository examDetailRepository;
    private final ExamQuestionRepository examQuestionRepository;

    @Transactional
    public byte[] exportExamToWord(UUID examId, boolean includeAnswers) throws IOException {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Đợt sinh đề không tồn tại"));

        List<ExamDetail> details = examDetailRepository.findByExamId(examId);

        try (XWPFDocument document = new XWPFDocument()) {
            if (includeAnswers) {
                exportAnswerFile(document, exam, details);
            } else {
                exportExamFile(document, exam, details);
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
    private void createCoverPage(XWPFDocument document, Exam exam, List<ExamDetail> details, boolean isAnswer) {
        int currentYear = LocalDate.now().getYear();

        String deptName = "KHOA BINH CHỦNG";
        if (exam.getSubject() != null && exam.getSubject().getDepartmentGroup() != null
                && exam.getSubject().getDepartmentGroup().getDepartment() != null
                && exam.getSubject().getDepartmentGroup().getDepartment().getName() != null) {
            deptName = exam.getSubject().getDepartmentGroup().getDepartment().getName().toUpperCase();
        }

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

        String academicYear = String.valueOf(currentYear);
        if (exam.getAcademicYear() != null && !exam.getAcademicYear().trim().isEmpty()) {
            academicYear = exam.getAcademicYear().trim();
        }

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
        cLeft.setWidth("4150");
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
        rBatch.setText("BỘ ĐỀ: " + String.format("%02d", Math.max(1, details.size())));

        // Vertical spacing before Exam Title
        XWPFParagraph pSpace1 = document.createParagraph();
        pSpace1.setSpacingBefore(800); // ~40pt

        // Exam Title
        XWPFParagraph pTitle = document.createParagraph();
        pTitle.setAlignment(ParagraphAlignment.CENTER);
        pTitle.setSpacingAfter(250);
        XWPFRun rTitle = pTitle.createRun();
        rTitle.setFontFamily("Times New Roman");
        rTitle.setFontSize(20);
        rTitle.setBold(true);
        rTitle.setText(title);

        // Metadata block (Indented)
        addCoverMetadataLine(document, "Môn: " + subjectName);
        addCoverMetadataLine(document, "Đối tượng: " + courseName);
        addCoverMetadataLine(document, "Đơn vị: Đại đội 10 - Tiểu đoàn 4");
        addCoverMetadataLine(document, "Năm học: " + academicYear);

        // Footer of Cover Page: "Hải Phòng, tháng       năm ...", chữ thường, KHÔNG in đậm, ở dưới cùng của trang bìa
        XWPFParagraph pCoverFooter = document.createParagraph();
        pCoverFooter.setAlignment(ParagraphAlignment.CENTER);
        pCoverFooter.setSpacingBefore(7300); // ~365pt pushes directly to the bottom of the cover page
        pCoverFooter.setSpacingAfter(0);
        XWPFRun rCoverFooter = pCoverFooter.createRun();
        rCoverFooter.setFontFamily("Times New Roman");
        rCoverFooter.setFontSize(13);
        rCoverFooter.setBold(false); // Chữ thường, KHÔNG in đậm
        rCoverFooter.setText("Hải Phòng, tháng       năm " + currentYear);

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
                ? examQuestionRepository.findByExamDetailId(details.get(0).getId())
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

    private void exportExamFile(XWPFDocument document, Exam exam, List<ExamDetail> details) {
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
        createCoverPage(document, exam, details, false);

        // ==========================================
        // 2. EXAM PAGES (TRANG ĐỀ THI)
        // ==========================================
        // Distribution of exams: 4 exams per page, ensuring at least 1 exam is on the last page with signatures
        List<Integer> distribution = calculatePageDistribution(details.size());

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
                List<ExamQuestion> questions = examQuestionRepository.findByExamDetailId(detail.getId());

                // Exam Box with Double Border: 100% full width, identical height across all frames
                XWPFTable examTable = document.createTable(1, 1);
                examTable.setWidth("100%");
                examTable.setTableAlignment(TableRowAlign.CENTER);
                examTable.getRow(0).setCantSplitRow(true);

                CTTblPr tblPrEx = examTable.getCTTbl().getTblPr() != null ? examTable.getCTTbl().getTblPr() : examTable.getCTTbl().addNewTblPr();
                CTTblWidth tblWEx = tblPrEx.getTblW() != null ? tblPrEx.getTblW() : tblPrEx.addNewTblW();
                tblWEx.setType(STTblWidth.DXA);
                tblWEx.setW(BigInteger.valueOf(10772)); // 190mm (full printable width on 10mm margins)

                // Minimum height for uniform 4 frames per page (3100 dxa ~ 55mm)
                CTTrPr trPrEx = examTable.getRow(0).getCtRow().getTrPr() != null ? examTable.getRow(0).getCtRow().getTrPr() : examTable.getRow(0).getCtRow().addNewTrPr();
                CTHeight hEx = trPrEx.addNewTrHeight();
                hEx.setVal(BigInteger.valueOf(3100));
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
                runHeader.setText("ĐỀ SỐ " + String.format("%02d", currentDetailIdx + 1));

                for (int qIdx = 0; qIdx < questions.size(); qIdx++) {
                    ExamQuestion eq = questions.get(qIdx);
                    XWPFParagraph qParagraph = cell.addParagraph();
                    qParagraph.setAlignment(ParagraphAlignment.BOTH);
                    qParagraph.setSpacingBefore(0);
                    qParagraph.setSpacingAfter(30);

                    XWPFRun qRun = qParagraph.createRun();
                    qRun.setBold(true);
                    qRun.setFontFamily("Times New Roman");
                    qRun.setFontSize(13);
                    String contentStr = eq.getQuestion().getContent();
                    qRun.setText("Câu " + (qIdx + 1) + ": " + contentStr);
                }

                currentDetailIdx++;

                // Intervening spacer paragraph (prevents Word table merging and provides clean spacing)
                XWPFParagraph sep = document.createParagraph();
                sep.setSpacingBefore(0);
                sep.setSpacingAfter(40);
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

                addRedItalicLine(sigLeft, "- Đơn vị: c10/d4;");
                addRedItalicLine(sigLeft, "- Số lượng: " + String.format("%02d bộ;", Math.max(1, details.size())));
                addRedItalicLine(sigLeft, "- Ngày thi:      /" + String.format("%02d", currentMonth) + "/" + currentYear);

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
    private void exportAnswerFile(XWPFDocument document, Exam exam, List<ExamDetail> details) {
        // 1. Cover Page for Answer file
        createCoverPage(document, exam, details, true);

        // 2. Grading Rubric (THỐNG NHẤT BIỂU ĐIỂM)
        createGradingRubricPage(document, exam, details);

        // 3. Answer Content for each Exam Set
        for (int dIndex = 0; dIndex < details.size(); dIndex++) {
            ExamDetail detail = details.get(dIndex);
            List<ExamQuestion> questions = examQuestionRepository.findByExamDetailId(detail.getId());

            if (dIndex > 0) {
                XWPFParagraph pageBreakPara = document.createParagraph();
                XWPFRun breakRun = pageBreakPara.createRun();
                breakRun.addBreak(BreakType.PAGE);
            }

            XWPFParagraph header = document.createParagraph();
            header.setAlignment(ParagraphAlignment.CENTER);
            header.setSpacingBefore(100);
            header.setSpacingAfter(100);
            XWPFRun runHeader = header.createRun();
            runHeader.setBold(true);
            runHeader.setFontFamily("Times New Roman");
            runHeader.setFontSize(13);
            runHeader.setText("ĐỀ SỐ " + String.format("%02d", dIndex + 1));

            for (int i = 0; i < questions.size(); i++) {
                ExamQuestion eq = questions.get(i);
                XWPFParagraph qParagraph = document.createParagraph();
                qParagraph.setAlignment(ParagraphAlignment.BOTH);
                qParagraph.setSpacingBefore(80);
                qParagraph.setSpacingAfter(40);

                XWPFRun qRun = qParagraph.createRun();
                qRun.setBold(true);
                qRun.setFontFamily("Times New Roman");
                qRun.setFontSize(13);
                String contentStr = eq.getQuestion().getContent();
                qRun.setText("Câu " + (i + 1) + ": " + contentStr);

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

                if (eq.getQuestion().getAnswer() != null && !eq.getQuestion().getAnswer().trim().isEmpty()) {
                    String[] answerLines = eq.getQuestion().getAnswer().split("\\r?\\n");
                    boolean hasActiveSubhead = false;

                    for (int lineIdx = 0; lineIdx < answerLines.length; lineIdx++) {
                        String rawLine = answerLines[lineIdx];
                        if (rawLine.trim().isEmpty()) continue;

                        String lineStr = rawLine.trim();
                        XWPFParagraph linePara = document.createParagraph();
                        linePara.setAlignment(ParagraphAlignment.BOTH);
                        linePara.setSpacingAfter(30);

                        XWPFRun lineRun = linePara.createRun();
                        lineRun.setFontFamily("Times New Roman");
                        lineRun.setFontSize(13);

                        boolean isSubhead = lineStr.matches("^(?i)[a-z0-9]+\\s*(\\)|\\.).*");
                        boolean isBullet = lineStr.startsWith("-") || lineStr.startsWith("+") || lineStr.startsWith("*") || lineStr.startsWith("•");

                        if (isSubhead) {
                            hasActiveSubhead = true;
                            linePara.setIndentationLeft(360);
                            lineRun.setText(lineStr);
                        } else if (isBullet) {
                            int leftIndent = hasActiveSubhead ? 720 : 540;
                            linePara.setIndentationLeft(leftIndent);
                            lineRun.setText(lineStr);
                        } else {
                            boolean isTitle = (lineIdx == 0) || !hasActiveSubhead;
                            if (isTitle) {
                                lineRun.setBold(true);
                                linePara.setIndentationLeft(180);
                            } else {
                                linePara.setIndentationLeft(360);
                            }
                            lineRun.setText(lineStr);
                        }
                    }
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
        marAns.setTop(BigInteger.valueOf(567));    // 10mm
        marAns.setBottom(BigInteger.valueOf(567)); // 10mm
        marAns.setLeft(BigInteger.valueOf(567));   // 10mm
        marAns.setRight(BigInteger.valueOf(567));  // 10mm

        CTPageBorders pgBordersAns = bodySectPr.addNewPgBorders();
        pgBordersAns.setOffsetFrom(STPageBorderOffset.TEXT);
        pgBordersAns.addNewTop().setVal(STBorder.NONE);
        pgBordersAns.addNewBottom().setVal(STBorder.NONE);
        pgBordersAns.addNewLeft().setVal(STBorder.NONE);
        pgBordersAns.addNewRight().setVal(STBorder.NONE);
    }

    /**
     * Calculate distribution of exams across pages:
     * - Max 4 exams per page without signatures.
     * - The final page with signatures MUST have at least 1 exam, and at most 3 exams.
     * - Example: 12 exams -> [4, 4, 3, 1] (4 pages, page 3 has 3, page 4 has 1 + signatures).
     */
    public List<Integer> calculatePageDistribution(int totalExams) {
        List<Integer> pages = new ArrayList<>();
        if (totalExams <= 0) {
            return pages;
        }
        if (totalExams <= 3) {
            pages.add(totalExams);
            return pages;
        }

        int fullPages = totalExams / 4;
        int rem = totalExams % 4;

        if (rem == 0) {
            // e.g. 12 -> 3 full pages of 4. But last page would have 0 exams + sig!
            // Move 1 exam to last page so page 3 has 3, page 4 has 1 + sig!
            for (int i = 0; i < fullPages - 1; i++) {
                pages.add(4);
            }
            pages.add(3);
            pages.add(1);
        } else {
            // e.g. 5 -> [4, 1]; 6 -> [4, 2]; 7 -> [4, 3]
            for (int i = 0; i < fullPages; i++) {
                pages.add(4);
            }
            pages.add(rem);
        }
        return pages;
    }

    private void addCoverMetadataLine(XWPFDocument document, String text) {
        XWPFParagraph p = document.createParagraph();
        p.setIndentationLeft(1700); // ~30mm
        p.setSpacingAfter(80);
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
}
