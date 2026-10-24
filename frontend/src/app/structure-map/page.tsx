"use client";

import React, { useEffect, useState } from 'react';
import { departmentService } from '@/services/departmentService';
import { StructureTreeNode } from '@/types/structureTree';
import { TrainingMindmap } from '@/components/structure/TrainingMindmap';
import { Button } from '@/components/ui/button';
import { RefreshCw, GitFork, BookOpen, Layers, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

export default function StructureMapPage() {
  const [treeData, setTreeData] = useState<StructureTreeNode | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTree = async () => {
    try {
      setLoading(true);
      const res = await departmentService.getStructureTree();
      setTreeData(res.data);
    } catch (err: any) {
      toast.error('Không thể tải sơ đồ cấu trúc đào tạo: ' + (err.message || 'Lỗi server'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  // Calculate statistics from tree data
  const countNodes = (root: StructureTreeNode | null) => {
    let departments = 0;
    let groups = 0;
    let subjects = 0;

    if (!root) return { departments, groups, subjects };

    const traverse = (node: StructureTreeNode) => {
      if (node.type === 'khoa' || node.type === 'department') departments++;
      if (node.type === 'bo_mon' || node.type === 'group') groups++;
      if (node.type === 'mon_hoc' || node.type === 'subject') subjects++;
      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    traverse(root);
    return { departments, groups, subjects };
  };

  const stats = countNodes(treeData);

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <GitFork className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Sơ đồ Cấu trúc Đào tạo
              </h2>
              <p className="text-sm text-muted-foreground">
                Mô hình cây phân cấp trực quan: Trường &rarr; Khoa &rarr; Tổ bộ môn &rarr; Môn học
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTree}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Khoa / Đơn vị</p>
            <p className="text-xl font-bold text-slate-800">{stats.departments}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3.5 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Tổ bộ môn</p>
            <p className="text-xl font-bold text-slate-800">{stats.groups}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-3.5 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-md bg-pink-50 text-pink-600 border border-pink-100">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Môn học</p>
            <p className="text-xl font-bold text-slate-800">{stats.subjects}</p>
          </div>
        </div>
      </div>

      {/* Mindmap Card */}
      {loading ? (
        <div className="w-full h-[600px] bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-3 text-muted-foreground shadow-sm">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Đang tải sơ đồ cấu trúc đào tạo...</p>
        </div>
      ) : treeData ? (
        <TrainingMindmap data={treeData} height="calc(100vh - 270px)" />
      ) : (
        <div className="w-full h-96 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-muted-foreground">
          Không có dữ liệu cấu trúc đào tạo
        </div>
      )}
    </div>
  );
}
