package com.example.examgenerator.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CourseRequest {
    @NotBlank(message = "Mã đối tượng không được để trống")
    @Size(max = 50, message = "Mã đối tượng không vượt quá 50 ký tự")
    private String courseCode;

    @NotBlank(message = "Tên đối tượng không được để trống")
    private String name;

    private String description;
    
    private Boolean isActive = true;
}
