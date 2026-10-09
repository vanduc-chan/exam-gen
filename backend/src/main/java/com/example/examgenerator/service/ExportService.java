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
    public byte[] exportExamToWord(UUID examId) throws IOException {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Đợt sinh đề không tồn tại"));

        List<ExamDetail> details = examDetailRepository.findByExamId(examId);

        try (XWPFDocument document = new XWPFDocument()) {
            for (int dIndex = 0; dIndex < details.size(); dIndex++) {
                ExamDetail detail = details.get(dIndex);
                
                // Create a table with 1 row and 1 column for the border box
                XWPFTable table = document.createTable(1, 1);
                
                // Set double borders
                table.setTopBorder(XWPFTable.XWPFBorderType.DOUBLE, 8, 0, "000000");
                table.setBottomBorder(XWPFTable.XWPFBorderType.DOUBLE, 8, 0, "000000");
                table.setLeftBorder(XWPFTable.XWPFBorderType.DOUBLE, 8, 0, "000000");
                table.setRightBorder(XWPFTable.XWPFBorderType.DOUBLE, 8, 0, "000000");
                
                // Set table width to 100%
                table.setWidth("100%");

                XWPFTableCell cell = table.getRow(0).getCell(0);
                
                // Header (ĐỀ SỐ XX)
                XWPFParagraph header = cell.getParagraphArray(0);
                header.setAlignment(ParagraphAlignment.CENTER);
                XWPFRun runHeader = header.createRun();
                runHeader.setBold(true);
                runHeader.setFontFamily("Times New Roman");
                runHeader.setFontSize(13);
                runHeader.setText("ĐỀ SỐ " + String.format("%02d", dIndex + 1));
                
                // Questions
                List<ExamQuestion> questions = examQuestionRepository.findByExamDetailId(detail.getId());
                for (int i = 0; i < questions.size(); i++) {
                    ExamQuestion eq = questions.get(i);
                    XWPFParagraph qParagraph = cell.addParagraph();
                    qParagraph.setAlignment(ParagraphAlignment.BOTH); // Justify
                    
                    XWPFRun qRun = qParagraph.createRun();
                    qRun.setBold(true);
                    qRun.setFontFamily("Times New Roman");
                    qRun.setFontSize(13);
                    // Format: Câu 1: Đồng chí trình bày... (4,0đ)
                    String contentStr = eq.getQuestion().getContent();
                    
                    // The image shows the entire question text in bold, including the score.
                    // Let's clean up any line breaks and put it all in bold.
                    String qText = "Câu " + (i + 1) + ": " + contentStr + " (" + 
                        (eq.getScore() != null ? String.format("%.1f", eq.getScore()).replace('.', ',') : "0,0") + "đ)";
                    qRun.setText(qText);
                }
                
                // Add an empty paragraph inside the cell at the end for padding
                XWPFParagraph pad = cell.addParagraph();
                XWPFRun padRun = pad.createRun();
                padRun.setFontSize(13);
                
                // Separator if not last
                if (dIndex < details.size() - 1) {
                    XWPFParagraph sep = document.createParagraph();
                    sep.setAlignment(ParagraphAlignment.CENTER);
                    XWPFRun sepRun = sep.createRun();
                    sepRun.setText(".........................................................................................................................................................");
                    sepRun.setFontSize(10);
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
