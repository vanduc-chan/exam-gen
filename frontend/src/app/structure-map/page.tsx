"use client";

import React, { useEffect, useState } from 'react';
import { departmentService } from '@/services/departmentService';
import { StructureTreeNode } from '@/types/structureTree';
import { TrainingMindmap } from '@/components/structure/TrainingMindmap';
import { GitFork, Loader2 } from 'lucide-react';
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

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
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

      {/* Mindmap Card */}
      {loading ? (
        <div className="w-full h-[650px] bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-3 text-muted-foreground shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Đang tải sơ đồ cấu trúc đào tạo...</p>
        </div>
      ) : treeData ? (
        <TrainingMindmap data={treeData} height="calc(100vh - 170px)" />
      ) : (
        <div className="w-full h-96 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-muted-foreground">
          Không có dữ liệu cấu trúc đào tạo
        </div>
      )}
    </div>
  );
}
