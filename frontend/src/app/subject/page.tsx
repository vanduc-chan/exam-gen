import React, { useEffect, useState } from 'react';
import { Subject, SubjectRequest } from '@/types/subject';
import { DepartmentGroup } from '@/types/departmentGroup';
import { subjectService } from '@/services/subjectService';
import { departmentGroupService } from '@/services/departmentGroupService';
import SubjectTable from '@/components/subject/SubjectTable';
import SubjectForm from '@/components/subject/SubjectForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const SubjectPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departmentGroups, setDepartmentGroups] = useState<DepartmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, groupsRes] = await Promise.all([
        subjectService.getAll(),
        departmentGroupService.getAll(),
      ]);
      setSubjects(subjectsRes.data);
      setDepartmentGroups(groupsRes.data.filter(g => g.isActive));
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
    setSelectedSubject(null);
    setIsFormOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa môn học này?')) {
      try {
        await subjectService.delete(id);
        toast.success('Xóa môn học thành công');
        loadData();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi xóa môn học');
      }
    }
  };

  const handleSubmit = async (data: SubjectRequest) => {
    try {
      setIsSubmitting(true);
      if (selectedSubject) {
        await subjectService.update(selectedSubject.id, data);
        toast.success('Cập nhật môn học thành công');
      } else {
        await subjectService.create(data);
        toast.success('Thêm môn học thành công');
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
        <h2 className="text-2xl font-bold tracking-tight">Quản lý Môn Học</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm mới
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <SubjectTable 
          subjects={subjects} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      )}

      <SubjectForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={selectedSubject}
        departmentGroups={departmentGroups}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default SubjectPage;
