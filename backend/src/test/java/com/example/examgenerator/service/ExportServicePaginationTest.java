package com.example.examgenerator.service;

import com.example.examgenerator.entity.Department;
import com.example.examgenerator.entity.DepartmentGroup;
import com.example.examgenerator.entity.Exam;
import com.example.examgenerator.entity.Subject;
import com.example.examgenerator.repository.SubjectRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ExportServicePaginationTest {

    private final ExportService exportService = new ExportService(null, null, null, null, null);

    @Test
    void testCalculatePageDistribution4PerPage() {
        assertEquals(List.of(1), exportService.calculatePageDistribution(1, 4));
        assertEquals(List.of(3), exportService.calculatePageDistribution(3, 4));
        assertEquals(List.of(3, 1), exportService.calculatePageDistribution(4, 4));
        assertEquals(List.of(4, 1), exportService.calculatePageDistribution(5, 4));
        assertEquals(List.of(4, 3, 1), exportService.calculatePageDistribution(8, 4));
        assertEquals(List.of(4, 4, 3, 1), exportService.calculatePageDistribution(12, 4));
        assertEquals(List.of(4, 4, 4, 4, 3, 1), exportService.calculatePageDistribution(20, 4));
    }

    @Test
    void testCalculatePageDistribution3PerPage() {
        assertEquals(List.of(1), exportService.calculatePageDistribution(1, 3));
        assertEquals(List.of(2), exportService.calculatePageDistribution(2, 3));
        assertEquals(List.of(2, 1), exportService.calculatePageDistribution(3, 3));
        assertEquals(List.of(3, 1), exportService.calculatePageDistribution(4, 3));
        assertEquals(List.of(3, 2), exportService.calculatePageDistribution(5, 3));
        assertEquals(List.of(3, 2, 1), exportService.calculatePageDistribution(6, 3));
        assertEquals(List.of(3, 3, 3, 2, 1), exportService.calculatePageDistribution(12, 3));
        assertEquals(List.of(3, 3, 3, 3, 3, 3, 2), exportService.calculatePageDistribution(20, 3));
    }

    @Test
    void testCalculatePageDistribution2PerPage() {
        assertEquals(List.of(1), exportService.calculatePageDistribution(1, 2));
        assertEquals(List.of(1, 1), exportService.calculatePageDistribution(2, 2));
        assertEquals(List.of(2, 1), exportService.calculatePageDistribution(3, 2));
        assertEquals(List.of(2, 1, 1), exportService.calculatePageDistribution(4, 2));
        assertEquals(List.of(2, 2, 1), exportService.calculatePageDistribution(5, 2));
        assertEquals(List.of(2, 2, 1, 1), exportService.calculatePageDistribution(6, 2));
    }

    @Test
    void testLastPageAlwaysHasAtLeastOneExamAndLeavesRoomForSignature() {
        for (int maxPerPage : List.of(2, 3, 4)) {
            for (int total = 1; total <= 50; total++) {
                List<Integer> dist = exportService.calculatePageDistribution(total, maxPerPage);
                int sum = dist.stream().mapToInt(Integer::intValue).sum();
                assertEquals(total, sum, "Sum must equal totalExams for total=" + total + ", maxPerPage=" + maxPerPage);
                int lastPageCount = dist.get(dist.size() - 1);
                assertTrue(lastPageCount >= 1, "Last page must have at least 1 exam");
                assertTrue(lastPageCount <= maxPerPage - 1, "Last page must leave room for signature block");
            }
        }
    }

    @Test
    void testCalculateUniformExamBoxHeight() {
        // maxPerPage = 4: baseMin = 3100, maxSafeHeight = (15704 - 600 - 100) / 4 = 3751
        assertEquals(3100L, exportService.calculateUniformExamBoxHeight(4, 4));
        assertEquals(3350L, exportService.calculateUniformExamBoxHeight(4, 10)); // 650 + 2700 = 3350
        assertEquals(3751L, exportService.calculateUniformExamBoxHeight(4, 15)); // capped at 3751

        // maxPerPage = 3: baseMin = 3400, maxSafeHeight = (15704 - 400 - 100) / 3 = 5068
        assertEquals(3400L, exportService.calculateUniformExamBoxHeight(3, 8));
        assertEquals(3890L, exportService.calculateUniformExamBoxHeight(3, 12)); // 650 + 3240 = 3890
        assertEquals(5068L, exportService.calculateUniformExamBoxHeight(3, 18)); // capped at 5068

        // maxPerPage = 2: baseMin = 4200, maxSafeHeight = (15704 - 200 - 100) / 2 = 7702
        assertEquals(4200L, exportService.calculateUniformExamBoxHeight(2, 10));
        assertEquals(5510L, exportService.calculateUniformExamBoxHeight(2, 18)); // 650 + 4860 = 5510
    }

    @Test
    void testFormatDepartmentName() {
        assertEquals("KHOA BINH CHỦNG", exportService.formatDepartmentName("Khoa Binh chủng"));
        assertEquals("KHOA BINH CHỦNG HỢP THÀNH", exportService.formatDepartmentName("Binh chủng hợp thành"));
        assertEquals("KHOA KHOA HỌC XÃ HỘI VÀ NHÂN VĂN", exportService.formatDepartmentName("Khoa học Xã hội và Nhân văn"));
        assertEquals("KHOA KHOA HỌC XÃ HỘI VÀ NHÂN VĂN", exportService.formatDepartmentName("Khoa Khoa học Xã hội và Nhân văn"));
        assertEquals("KHOA CHUYÊN MÔN - KỸ THUẬT", exportService.formatDepartmentName("Chuyên môn - Kỹ thuật"));
        assertEquals("KHOA QUÂN SỰ ĐỊA PHƯƠNG", exportService.formatDepartmentName("Quân sự địa phương"));
        assertEquals("KHOA BINH CHỦNG", exportService.formatDepartmentName(null));
        assertEquals("KHOA BINH CHỦNG", exportService.formatDepartmentName("   "));
    }

    @Test
    void testResolveDepartmentNameForGraduationExamFirstSubject() {
        SubjectRepository mockSubRepo = Mockito.mock(SubjectRepository.class);
        ObjectMapper mapper = new ObjectMapper();
        ExportService service = new ExportService(null, null, null, mockSubRepo, mapper);

        UUID subId1 = UUID.randomUUID();
        UUID subId2 = UUID.randomUUID();

        Department dept1 = Department.builder()
                .name("Khoa học Xã hội và Nhân văn")
                .build();
        DepartmentGroup group1 = DepartmentGroup.builder()
                .department(dept1)
                .build();
        Subject sub1 = Subject.builder()
                .subjectName("Công tác Đảng, CTCT")
                .departmentGroup(group1)
                .build();
        sub1.setId(subId1);

        Mockito.when(mockSubRepo.findById(subId1)).thenReturn(Optional.of(sub1));
        Mockito.when(mockSubRepo.findByIdWithDepartment(subId1)).thenReturn(Optional.of(sub1));

        String blueprintSnapshot = "[{\"id\":\"sec-1\",\"sectionOrder\":1,\"title\":\"Phần 1\",\"subjectId\":\"" + subId1 + "\"},"
                + "{\"id\":\"sec-2\",\"sectionOrder\":2,\"title\":\"Phần 2\",\"subjectId\":\"" + subId2 + "\"}]";

        Exam exam = Exam.builder()
                .examType("GRADUATION")
                .blueprintSnapshot(blueprintSnapshot)
                .build();

        String deptName = service.resolveDepartmentNameForCover(exam, Collections.emptyList());
        assertEquals("KHOA KHOA HỌC XÃ HỘI VÀ NHÂN VĂN", deptName);
    }
}
