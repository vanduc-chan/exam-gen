import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Department, DepartmentRequest } from '@/types/department';
import { departmentService } from '@/services/departmentService';
import DepartmentTable from '@/components/department/DepartmentTable';
import DepartmentForm from '@/components/department/DepartmentForm';
import DepartmentImportModal from '@/components/department/DepartmentImportModal';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const DepartmentPage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const page = currentPage - 1;
  const pageSize = 10;
  const totalPages = Math.ceil(departments.length / pageSize);

  const setPage = (newPageOrFn: number | ((p: number) => number)) => {
    const targetZeroBased = typeof newPageOrFn === 'function' ? newPageOrFn(page) : newPageOrFn;
    const targetOneBased = Math.max(1, targetZeroBased + 1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', targetOneBased.toString());
      return next;
    });
  };

  const paginatedDepartments = departments.slice(page * pageSize, (page + 1) * pageSize);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentService.getAll();
      setDepartments(res.data);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải danh sách khoa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleCreate = () => {
    setSelectedDept(null);
    setIsFormOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setSelectedDept(dept);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khoa này?')) {
      try {
        await departmentService.delete(id);
        toast.success('Xóa khoa thành công');
        loadDepartments();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi xóa khoa');
      }
    }
  };

  const handleSubmit = async (data: DepartmentRequest) => {
    try {
      setIsSubmitting(true);
      if (selectedDept) {
        await departmentService.update(selectedDept.id, data);
        toast.success('Cập nhật khoa thành công');
      } else {
        await departmentService.create(data);
        toast.success('Thêm khoa thành công');
      }
      setIsFormOpen(false);
      loadDepartments();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Quản lý Khoa</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Nhập Excel
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Thêm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <>
          <DepartmentTable 
            departments={paginatedDepartments} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />

          {totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Trang {currentPage} / {totalPages} (Tổng số {departments.length} khoa)
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

      <DepartmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={selectedDept}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <DepartmentImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => loadDepartments()}
      />
    </div>
  );
};

export default DepartmentPage;
