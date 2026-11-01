import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Subject, SubjectRequest } from '@/types/subject';
import { DepartmentGroup } from '@/types/departmentGroup';
import { subjectService } from '@/services/subjectService';
import { departmentGroupService } from '@/services/departmentGroupService';
import SubjectTable from '@/components/subject/SubjectTable';
import SubjectForm from '@/components/subject/SubjectForm';
import SubjectFilter from '@/components/subject/SubjectFilter';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AppPagination } from '@/components/ui/app-pagination';
import { cleanSearchParam, normalizeSearchQuery } from '@/lib/utils';

const SubjectPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departmentGroups, setDepartmentGroups] = useState<DepartmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = cleanSearchParam(searchParams.get('search')) || '';
  const departmentGroupIdParam = searchParams.get('departmentGroupId') || '';
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const page = currentPage - 1;
  const pageSize = 10;

  const filteredSubjects = useMemo(() => {
    const q = normalizeSearchQuery(searchParam).toLowerCase();
    return subjects.filter(s => {
      // Filter by departmentGroupId
      if (departmentGroupIdParam && s.departmentGroupId !== departmentGroupIdParam) {
        return false;
      }
      // Filter by search
      if (q) {
        const matchesName = s.subjectName && s.subjectName.toLowerCase().includes(q);
        const matchesCode = s.subjectCode && s.subjectCode.toLowerCase().includes(q);
        const matchesGroup = s.departmentGroupName && s.departmentGroupName.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesGroup) return false;
      }
      return true;
    });
  }, [subjects, searchParam, departmentGroupIdParam]);

  const totalPages = Math.ceil(filteredSubjects.length / pageSize);

  const setPage = (newPageOrFn: number | ((p: number) => number)) => {
    const targetZeroBased = typeof newPageOrFn === 'function' ? newPageOrFn(page) : newPageOrFn;
    const targetOneBased = Math.max(1, targetZeroBased + 1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', targetOneBased.toString());
      return next;
    });
  };

  const handleFilterChange = (newFilters: { search?: string; departmentGroupId?: string }) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const cleanSearch = cleanSearchParam(newFilters.search);
      if (cleanSearch) {
        next.set('search', cleanSearch);
      } else {
        next.delete('search');
      }
      if (newFilters.departmentGroupId) {
        next.set('departmentGroupId', newFilters.departmentGroupId);
      } else {
        next.delete('departmentGroupId');
      }
      next.set('page', '1');
      return next;
    });
  };

  const paginatedSubjects = filteredSubjects.slice(page * pageSize, (page + 1) * pageSize);

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
    <div className="p-3 sm:p-5 md:p-8 space-y-4 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Quản lý Môn học</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm mới
        </Button>
      </div>

      <SubjectFilter
        departmentGroups={departmentGroups}
        filters={{ search: searchParam, departmentGroupId: departmentGroupIdParam }}
        onFilterChange={handleFilterChange}
      />

      {loading ? (
        <div className="text-center py-10 bg-white rounded-md border">Đang tải dữ liệu...</div>
      ) : (
        <>
          <SubjectTable 
            subjects={paginatedSubjects} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />

          <AppPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredSubjects.length}
            size={pageSize}
          />
        </>
      )}

      <SubjectForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        departmentGroups={departmentGroups}
        initialData={selectedSubject}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default SubjectPage;
