import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DepartmentGroup, DepartmentGroupRequest } from '@/types/departmentGroup';
import { Department } from '@/types/department';
import { departmentGroupService } from '@/services/departmentGroupService';
import { departmentService } from '@/services/departmentService';
import DepartmentGroupTable from '@/components/department-group/DepartmentGroupTable';
import DepartmentGroupForm from '@/components/department-group/DepartmentGroupForm';
import DepartmentGroupFilter from '@/components/department-group/DepartmentGroupFilter';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AppPagination } from '@/components/ui/app-pagination';

const DepartmentGroupPage = () => {
  const [groups, setGroups] = useState<DepartmentGroup[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DepartmentGroup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const departmentIdParam = searchParams.get('departmentId') || '';
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const page = currentPage - 1;
  const pageSize = 10;

  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      // Filter by departmentId
      if (departmentIdParam && g.departmentId !== departmentIdParam) {
        return false;
      }
      // Filter by search
      if (searchParam.trim()) {
        const q = searchParam.toLowerCase().trim();
        const matchesName = g.name && g.name.toLowerCase().includes(q);
        const matchesCode = g.code && g.code.toLowerCase().includes(q);
        const matchesDept = g.departmentName && g.departmentName.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDept) return false;
      }
      return true;
    });
  }, [groups, searchParam, departmentIdParam]);

  const totalPages = Math.ceil(filteredGroups.length / pageSize);

  const setPage = (newPageOrFn: number | ((p: number) => number)) => {
    const targetZeroBased = typeof newPageOrFn === 'function' ? newPageOrFn(page) : newPageOrFn;
    const targetOneBased = Math.max(1, targetZeroBased + 1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', targetOneBased.toString());
      return next;
    });
  };

  const handleFilterChange = (newFilters: { search?: string; departmentId?: string }) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newFilters.search) {
        next.set('search', newFilters.search);
      } else {
        next.delete('search');
      }
      if (newFilters.departmentId) {
        next.set('departmentId', newFilters.departmentId);
      } else {
        next.delete('departmentId');
      }
      next.set('page', '1');
      return next;
    });
  };

  const paginatedGroups = filteredGroups.slice(page * pageSize, (page + 1) * pageSize);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsRes, deptsRes] = await Promise.all([
        departmentGroupService.getAll(),
        departmentService.getAll(),
      ]);
      setGroups(groupsRes.data);
      setDepartments(deptsRes.data.filter(d => d.isActive));
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setSelectedGroup(null);
    setIsFormOpen(true);
  };

  const handleEdit = (group: DepartmentGroup) => {
    setSelectedGroup(group);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tổ bộ môn này?')) {
      try {
        await departmentGroupService.delete(id);
        toast.success('Xóa tổ bộ môn thành công');
        loadData();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi xóa tổ bộ môn');
      }
    }
  };

  const handleSubmit = async (data: DepartmentGroupRequest) => {
    try {
      setIsSubmitting(true);
      if (selectedGroup) {
        await departmentGroupService.update(selectedGroup.id, data);
        toast.success('Cập nhật tổ bộ môn thành công');
      } else {
        await departmentGroupService.create(data);
        toast.success('Thêm tổ bộ môn thành công');
      }
      setIsFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Quản lý Tổ bộ môn</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm mới
        </Button>
      </div>

      <DepartmentGroupFilter
        departments={departments}
        filters={{ search: searchParam, departmentId: departmentIdParam }}
        onFilterChange={handleFilterChange}
      />

      {loading ? (
        <div className="text-center py-10 bg-white rounded-md border">Đang tải dữ liệu...</div>
      ) : (
        <>
          <DepartmentGroupTable 
            groups={paginatedGroups} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />

          <AppPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredGroups.length}
            size={pageSize}
          />
        </>
      )}

      <DepartmentGroupForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        departments={departments}
        initialData={selectedGroup}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default DepartmentGroupPage;
