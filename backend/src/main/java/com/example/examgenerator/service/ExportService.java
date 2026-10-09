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
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final ExamRepository examRepository;
    private final ExamDetailRepository examDetailRepository;
    private final ExamQuestionRepository examQuestionRepository;

    @Transactional
    public byte[] exportExamToZip(UUID examId) throws IOException {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Đợt sinh đề không tồn tại"));

        List<ExamDetail> details = examDetailRepository.findByExamId(examId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            for (ExamDetail detail : details) {
                byte[] wordBytes = generateWordDocument(exam, detail);
                ZipEntry entry = new ZipEntry(detail.getExamSetCode() + ".docx");
                zos.putNextEntry(entry);
                zos.write(wordBytes);
                zos.closeEntry();
            }
        }

        // Update status to EXPORTED
        exam.setStatus(ExamStatus.EXPORTED);
        examRepository.save(exam);

        return baos.toByteArray();
    }

    private byte[] generateWordDocument(Exam exam, ExamDetail detail) throws IOException {
        try (XWPFDocument document = new XWPFDocument()) {
            
            // Header
            XWPFParagraph header = document.createParagraph();
            header.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun runHeader = header.createRun();
            runHeader.setBold(true);
            runHeader.setFontSize(14);
            runHeader.setText(exam.getTitle().toUpperCase());
            runHeader.addBreak();
            runHeader.setText("Môn: " + exam.getSubject().getSubjectName());
            runHeader.addBreak();
            runHeader.setText("Mã đề: " + detail.getExamSetCode());
            runHeader.addBreak();
            
            XWPFRun runSubHeader = header.createRun();
            runSubHeader.setItalic(true);
            runSubHeader.setText("Thời gian làm bài: " + exam.getDurationMinutes() + " phút");
            runSubHeader.addBreak();
            runSubHeader.addBreak();

            // Questions
            List<ExamQuestion> questions = examQuestionRepository.findByExamDetailId(detail.getId());
            for (int i = 0; i < questions.size(); i++) {
                ExamQuestion eq = questions.get(i);
                XWPFParagraph qParagraph = document.createParagraph();
                XWPFRun qRun = qParagraph.createRun();
                qRun.setBold(true);
                qRun.setText("Câu " + (i + 1) + " (" + eq.getScore() + " điểm): ");
                
                XWPFRun qContent = qParagraph.createRun();
                qContent.setText(eq.getQuestion().getContent());
                qContent.addBreak();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.write(out);
            return out.toByteArray();
        }
    }
}
