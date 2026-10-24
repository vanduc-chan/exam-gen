package com.example.examgenerator.service;

import com.example.examgenerator.dto.request.DepartmentRequest;
import com.example.examgenerator.dto.response.DepartmentResponse;
import com.example.examgenerator.dto.response.StructureTreeNode;
import com.example.examgenerator.entity.Department;
import com.example.examgenerator.exception.ResourceNotFoundException;
import com.example.examgenerator.mapper.DepartmentMapper;
import com.example.examgenerator.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.io.InputStream;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import com.example.examgenerator.entity.DepartmentGroup;
import com.example.examgenerator.entity.Subject;

import com.example.examgenerator.repository.DepartmentGroupRepository;
import com.example.examgenerator.repository.SubjectRepository;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentGroupRepository departmentGroupRepository;
    private final SubjectRepository subjectRepository;
    private final DepartmentMapper departmentMapper;

    @Transactional(readOnly = true)
    public StructureTreeNode getStructureTree() {
        StructureTreeNode root = StructureTreeNode.builder()
                .id("root")
                .name("Trường Quân sự Quân khu 3")
                .type("root")
                .code("QSQK3")
                .children(new ArrayList<>())
                .build();

        List<Department> departments = departmentRepository.findAll();
        List<DepartmentGroup> groups = departmentGroupRepository.findAll();
        List<Subject> subjects = subjectRepository.findAll();

        for (Department dept : departments) {
            StructureTreeNode deptNode = StructureTreeNode.builder()
                    .id(dept.getId() != null ? dept.getId().toString() : UUID.randomUUID().toString())
                    .name(dept.getName())
                    .code(dept.getCode())
                    .type("khoa")
                    .description(dept.getDescription())
                    .children(new ArrayList<>())
                    .build();

            List<DepartmentGroup> deptGroups = groups.stream()
                    .filter(g -> g.getDepartment() != null && g.getDepartment().getId().equals(dept.getId()))
                    .collect(Collectors.toList());

            for (DepartmentGroup group : deptGroups) {
                StructureTreeNode groupNode = StructureTreeNode.builder()
                        .id(group.getId() != null ? group.getId().toString() : UUID.randomUUID().toString())
                        .name(group.getName())
                        .code(group.getCode())
                        .type("bo_mon")
                        .description(group.getDescription())
                        .children(new ArrayList<>())
                        .build();

                List<Subject> groupSubjects = subjects.stream()
                        .filter(s -> s.getDepartmentGroup() != null && s.getDepartmentGroup().getId().equals(group.getId()))
                        .collect(Collectors.toList());

                for (Subject sub : groupSubjects) {
                    StructureTreeNode subNode = StructureTreeNode.builder()
                            .id(sub.getId() != null ? sub.getId().toString() : UUID.randomUUID().toString())
                            .name(sub.getSubjectName())
                            .code(sub.getSubjectCode())
                            .type("mon_hoc")
                            .description(sub.getDescription())
                            .children(new ArrayList<>())
                            .build();
                    groupNode.getChildren().add(subNode);
                }

                deptNode.getChildren().add(groupNode);
            }

            root.getChildren().add(deptNode);
        }

        return root;
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(departmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khoa không tồn tại với ID: " + id));
        return departmentMapper.toResponse(department);
    }

    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã khoa đã tồn tại: " + request.getCode());
        }
        Department department = departmentMapper.toEntity(request);
        department = departmentRepository.save(department);
        return departmentMapper.toResponse(department);
    }

    @Transactional
    public DepartmentResponse updateDepartment(UUID id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khoa không tồn tại với ID: " + id));
        
        if (!department.getCode().equals(request.getCode()) && departmentRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã khoa đã tồn tại: " + request.getCode());
        }

        departmentMapper.updateEntityFromRequest(department, request);
        department = departmentRepository.save(department);
        return departmentMapper.toResponse(department);
    }

    @Transactional
    public void deleteDepartment(UUID id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Khoa không tồn tại với ID: " + id);
        }
        try {
            departmentRepository.deleteById(id);
            departmentRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Không thể xóa Khoa/Phòng này vì đang có Tổ bộ môn hoặc Môn học liên quan. Vui lòng kiểm tra lại!");
        }
    }

    @Transactional
    public void importDepartmentsFromExcel(MultipartFile file) {
        DataFormatter dataFormatter = new DataFormatter();
        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            boolean isFirstRow = true;

            Department currentDepartment = null;
            DepartmentGroup currentGroup = null;

            for (Row row : sheet) {
                if (isFirstRow) {
                    isFirstRow = false;
                    continue; // Skip header
                }
                
                if (row.getPhysicalNumberOfCells() == 0) continue;

                Cell deptCodeCell = row.getCell(0, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                Cell deptNameCell = row.getCell(1, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                Cell groupCodeCell = row.getCell(2, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                Cell groupNameCell = row.getCell(3, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                Cell subjectCodeCell = row.getCell(4, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                Cell subjectNameCell = row.getCell(5, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);

                String deptCode = deptCodeCell != null ? dataFormatter.formatCellValue(deptCodeCell).trim() : "";
                String deptName = deptNameCell != null ? dataFormatter.formatCellValue(deptNameCell).trim() : "";
                String groupCode = groupCodeCell != null ? dataFormatter.formatCellValue(groupCodeCell).trim() : "";
                String groupName = groupNameCell != null ? dataFormatter.formatCellValue(groupNameCell).trim() : "";
                String subjectCode = subjectCodeCell != null ? dataFormatter.formatCellValue(subjectCodeCell).trim() : "";
                String subjectName = subjectNameCell != null ? dataFormatter.formatCellValue(subjectNameCell).trim() : "";

                if (deptCode.isEmpty() && deptName.isEmpty() && groupCode.isEmpty() && groupName.isEmpty() && subjectCode.isEmpty() && subjectName.isEmpty()) {
                    continue;
                }

                if (!deptCode.isEmpty() && !deptName.isEmpty()) {
                    final String dCode = deptCode;
                    currentDepartment = departmentRepository.findByCode(deptCode)
                            .orElseGet(() -> {
                                Department newDept = new Department();
                                newDept.setCode(dCode);
                                newDept.setName(deptName);
                                newDept.setIsActive(true);
                                return departmentRepository.save(newDept);
                            });
                    currentGroup = null; // Reset group when department changes
                }

                if (currentDepartment == null) continue;

                if (!groupCode.isEmpty() && !groupName.isEmpty()) {
                    final String gCode = groupCode;
                    final Department dept = currentDepartment;
                    currentGroup = departmentGroupRepository.findByCode(groupCode)
                            .orElseGet(() -> {
                                DepartmentGroup newGroup = new DepartmentGroup();
                                newGroup.setCode(gCode);
                                newGroup.setName(groupName);
                                newGroup.setDepartment(dept);
                                newGroup.setIsActive(true);
                                return departmentGroupRepository.save(newGroup);
                            });
                }

                if (currentGroup == null) continue;

                if (!subjectCode.isEmpty() && !subjectName.isEmpty()) {
                    final String sCode = subjectCode;
                    final DepartmentGroup grp = currentGroup;
                    subjectRepository.findBySubjectCode(subjectCode)
                            .orElseGet(() -> {
                                Subject newSubject = new Subject();
                                newSubject.setSubjectCode(sCode);
                                newSubject.setSubjectName(subjectName);
                                newSubject.setDepartmentGroup(grp);
                                return subjectRepository.save(newSubject);
                            });
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi đọc file Excel: " + e.getMessage(), e);
        }
    }
}
