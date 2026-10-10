package com.example.examgenerator.service;

import com.example.examgenerator.entity.Exam;
import com.example.examgenerator.entity.ExamDetail;
import com.example.examgenerator.entity.ExamQuestion;
import com.example.examgenerator.enumerate.ExamStatus;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.repository.ExamDetailRepository;
import com.example.examgenerator.repository.ExamQuestionRepository;
import com.example.examgenerator.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

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
            for (int dIndex = 0; dIndex < details.size(); dIndex++) {
                ExamDetail detail = details.get(dIndex);
                List<ExamQuestion> questions = examQuestionRepository.findByExamDetailId(detail.getId());

                if (includeAnswers) {
                    // --- EXPORT ANSWER FILE (PAGE BREAK BETWEEN EXAMS, NO BORDER BOX, NO DASHED SEPARATOR) ---
                    if (dIndex > 0) {
                        XWPFParagraph pageBreakPara = document.createParagraph();
                        XWPFRun breakRun = pageBreakPara.createRun();
                        breakRun.addBreak(BreakType.PAGE);
                    }

                    XWPFParagraph header = document.createParagraph();
                    header.setAlignment(ParagraphAlignment.CENTER);
                    XWPFRun runHeader = header.createRun();
                    runHeader.setBold(true);
                    runHeader.setFontFamily("Times New Roman");
                    runHeader.setFontSize(13);
                    runHeader.setText("ĐỀ SỐ " + String.format("%02d", dIndex + 1));

                    for (int i = 0; i < questions.size(); i++) {
                        ExamQuestion eq = questions.get(i);
                        XWPFParagraph qParagraph = document.createParagraph();
                        qParagraph.setAlignment(ParagraphAlignment.BOTH);
                        
                        XWPFRun qRun = qParagraph.createRun();
                        qRun.setBold(true);
                        qRun.setFontFamily("Times New Roman");
                        qRun.setFontSize(13);
                        String contentStr = eq.getQuestion().getContent();
                        String qText = "Câu " + (i + 1) + ": " + contentStr + " (" + 
                            (eq.getScore() != null ? String.format("%.1f", eq.getScore()).replace('.', ',') : "0,0") + "đ)";
                        qRun.setText(qText);

                        // "ĐÁP ÁN" Header
                        XWPFParagraph ansHeader = document.createParagraph();
                        ansHeader.setAlignment(ParagraphAlignment.CENTER);
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

                                boolean isSubhead = lineStr.matches("^(?i)[a-z0-9]+\\s*[\\)\\.].*");
                                boolean isBullet = lineStr.startsWith("-") || lineStr.startsWith("+") || lineStr.startsWith("*") || lineStr.startsWith("•");

                                if (isSubhead) {
                                    hasActiveSubhead = true;
                                    linePara.setIndentationLeft(360); // 0.25 inch
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
                } else {
                    // --- EXPORT EXAM FILE (CONTINUOUS EXAMS, DOUBLE BORDER BOX, DASHED SEPARATOR OUTSIDE) ---
                    XWPFTable table = document.createTable(1, 1);
                    XWPFTableRow row = table.getRow(0);
                    row.setCantSplitRow(true);

                    table.setTopBorder(XWPFTable.XWPFBorderType.DOUBLE, 8, 0, "000000");
                    table.setBottomBorder(XWPFTable.XWPFBorderType.DOUBLE, 8, 0, "000000");
                    table.setLeftBorder(XWPFTable.XWPFBorderType.DOUBLE, 8, 0, "000000");
                    table.setRightBorder(XWPFTable.XWPFBorderType.DOUBLE, 8, 0, "000000");
                    table.setWidth("100%");

                    XWPFTableCell cell = row.getCell(0);
                    
                    XWPFParagraph header = cell.getParagraphArray(0);
                    header.setAlignment(ParagraphAlignment.CENTER);
                    XWPFRun runHeader = header.createRun();
                    runHeader.setBold(true);
                    runHeader.setFontFamily("Times New Roman");
                    runHeader.setFontSize(13);
                    runHeader.setText("ĐỀ SỐ " + String.format("%02d", dIndex + 1));
                    
                    for (int i = 0; i < questions.size(); i++) {
                        ExamQuestion eq = questions.get(i);
                        XWPFParagraph qParagraph = cell.addParagraph();
                        qParagraph.setAlignment(ParagraphAlignment.BOTH);
                        
                        XWPFRun qRun = qParagraph.createRun();
                        qRun.setBold(true);
                        qRun.setFontFamily("Times New Roman");
                        qRun.setFontSize(13);
                        String contentStr = eq.getQuestion().getContent();
                        String qText = "Câu " + (i + 1) + ": " + contentStr + " (" + 
                            (eq.getScore() != null ? String.format("%.1f", eq.getScore()).replace('.', ',') : "0,0") + "đ)";
                        qRun.setText(qText);
                    }
                    
                    XWPFParagraph pad = cell.addParagraph();
                    XWPFRun padRun = pad.createRun();
                    padRun.setFontSize(13);
                    
                    // Dashed cutting line OUTSIDE table cell, between exam papers
                    if (dIndex < details.size() - 1) {
                        XWPFParagraph sep = document.createParagraph(); // OUTSIDE TABLE
                        sep.setAlignment(ParagraphAlignment.CENTER);
                        sep.setSpacingBefore(100);
                        sep.setSpacingAfter(100);
                        XWPFRun sepRun = sep.createRun();
                        sepRun.setText(".........................................................................................................................................................");
                        sepRun.setFontSize(10);
                    }
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.write(out);
            
            // Update status to EXPORTED
            exam.setStatus(ExamStatus.EXPORTED);
            examRepository.save(exam);
            
            return out.toByteArray();
        }
    }
}
