package com.example.examgenerator.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StructureTreeNode {
    private String id;
    private String name;
    private String code;
    private String type; // "root", "khoa", "bo_mon", "mon_hoc"
    private String description;
    @Builder.Default
    private List<StructureTreeNode> children = new ArrayList<>();
}
