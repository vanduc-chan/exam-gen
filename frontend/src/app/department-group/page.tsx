import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DepartmentGroup, DepartmentGroupRequest } from '@/types/departmentGroup';
import { Department } from '@/types/department';
import { departmentGroupService } from '@/services/departmentGroupService';
import { departmentService } from '@/services/departmentService';
import DepartmentGroupTable from '@/components/department-group/DepartmentGroupTable';
import DepartmentGroupForm from '@/components/department-group/DepartmentGroupForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const DepartmentGroupPage = () => {
  const [groups, setGroups] = useState<DepartmentGroup[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DepartmentGroup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const page = currentPage - 1;
  const pageSize = 10;
  const totalPages = Math.ceil(groups.length / pageSize);

  const setPage = (newPageOrFn: number | ((p: number) => number)) => {
    const targetZeroBased = typeof newPageOrFn === 'function' ? newPageOrFn(page) : newPageOrFn;
    const targetOneBased = Math.max(1, targetZeroBased + 1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', targetOneBased.toString());
      return next;
    });
  };

  const paginatedGroups = groups.slice(page * pageSize, (page + 1) * pageSize);

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
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Quản lý Tổ Bộ Môn</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm mới
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <>
          <DepartmentGroupTable 
            groups={paginatedGroups} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />

          {totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Trang {currentPage} / {totalPages} (Tổng số {groups.length} tổ bộ môn)
              </div>
              <Pagination className="order-1 sm:order-2 justify-end w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        isActive={page === i}
                        onClick={() => setPage(i)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      className={page === totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      <DepartmentGroupForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={selectedGroup}
        departments={departments}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default DepartmentGroupPage;
