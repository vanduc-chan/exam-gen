import React, { useEffect, useState } from 'react';
import { DepartmentGroup, DepartmentGroupRequest } from '@/types/departmentGroup';
import { Department } from '@/types/department';
import { departmentGroupService } from '@/services/departmentGroupService';
import { departmentService } from '@/services/departmentService';
import DepartmentGroupTable from '@/components/department-group/DepartmentGroupTable';
import DepartmentGroupForm from '@/components/department-group/DepartmentGroupForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const DepartmentGroupPage = () => {
  const [groups, setGroups] = useState<DepartmentGroup[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DepartmentGroup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Quản lý Tổ Bộ Môn</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm mới
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <DepartmentGroupTable 
          groups={groups} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
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
