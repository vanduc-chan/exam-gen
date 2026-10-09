package com.example.examgenerator.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class SubjectRequest {
    @NotBlank(message = "Mã môn học không được để trống")
    @Size(max = 50, message = "Mã môn học không vượt quá 50 ký tự")
    private String subjectCode;

    @NotBlank(message = "Tên môn học không được để trống")
    private String subjectName;

    private String description;
    
    private UUID departmentGroupId;
}
