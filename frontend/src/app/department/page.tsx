import React, { useEffect, useState } from 'react';
import { Department, DepartmentRequest } from '@/types/department';
import { departmentService } from '@/services/departmentService';
import DepartmentTable from '@/components/department/DepartmentTable';
import DepartmentForm from '@/components/department/DepartmentForm';
import DepartmentImportModal from '@/components/department/DepartmentImportModal';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

const DepartmentPage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Quản lý Khoa</h2>
        <div className="flex gap-2">
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
        <DepartmentTable 
          departments={departments} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
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
