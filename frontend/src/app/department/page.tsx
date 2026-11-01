import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Department, DepartmentRequest } from '@/types/department';
import { departmentService } from '@/services/departmentService';
import DepartmentTable from '@/components/department/DepartmentTable';
import DepartmentForm from '@/components/department/DepartmentForm';
import DepartmentImportModal from '@/components/department/DepartmentImportModal';
import DepartmentFilter from '@/components/department/DepartmentFilter';
import { Button } from '@/components/ui/button';
import { Plus, Upload, GitFork } from 'lucide-react';
import { toast } from 'sonner';
import { AppPagination } from '@/components/ui/app-pagination';
import { cleanSearchParam, normalizeSearchQuery } from '@/lib/utils';

const DepartmentPage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = cleanSearchParam(searchParams.get('search')) || '';
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const page = currentPage - 1;
  const pageSize = 10;

  const filteredDepartments = useMemo(() => {
    const q = normalizeSearchQuery(searchParam).toLowerCase();
    if (!q) return departments;
    return departments.filter(d => 
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.code && d.code.toLowerCase().includes(q))
    );
  }, [departments, searchParam]);

  const totalPages = Math.ceil(filteredDepartments.length / pageSize);

  const setPage = (newPageOrFn: number | ((p: number) => number)) => {
    const targetZeroBased = typeof newPageOrFn === 'function' ? newPageOrFn(page) : newPageOrFn;
    const targetOneBased = Math.max(1, targetZeroBased + 1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', targetOneBased.toString());
      return next;
    });
  };

  const handleFilterChange = (newFilters: { search?: string }) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const cleanSearch = cleanSearchParam(newFilters.search);
      if (cleanSearch) {
        next.set('search', cleanSearch);
      } else {
        next.delete('search');
      }
      next.set('page', '1');
      return next;
    });
  };

  const paginatedDepartments = filteredDepartments.slice(page * pageSize, (page + 1) * pageSize);

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
          <Link to="/structure-map">
            <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <GitFork className="mr-2 h-4 w-4 text-indigo-600" /> Sơ đồ đào tạo
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Nhập Excel
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Thêm mới
          </Button>
        </div>
      </div>

      <DepartmentFilter
        filters={{ search: searchParam }}
        onFilterChange={handleFilterChange}
      />

      {loading ? (
        <div className="text-center py-10 bg-white rounded-md border">Đang tải dữ liệu...</div>
      ) : (
        <>
          <DepartmentTable 
            departments={paginatedDepartments} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />

          <AppPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredDepartments.length}
            size={pageSize}
          />
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
