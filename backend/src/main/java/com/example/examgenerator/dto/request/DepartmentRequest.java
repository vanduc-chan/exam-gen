package com.example.examgenerator.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DepartmentRequest {
    @NotBlank(message = "Mã khoa không được để trống")
    @Size(max = 50, message = "Mã khoa không vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên khoa không được để trống")
    private String name;

    private String description;
    
    private Boolean isActive = true;
}
