package com.example.examgenerator.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class DepartmentGroupRequest {
    @NotBlank(message = "Mã tổ bộ môn không được để trống")
    @Size(max = 50, message = "Mã tổ bộ môn không vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên tổ bộ môn không được để trống")
    private String name;

    private String description;
    
    @NotNull(message = "ID khoa không được để trống")
    private UUID departmentId;

    private Boolean isActive = true;
}
