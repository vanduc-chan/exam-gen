import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Course, CourseRequest } from '@/types/course';
import { courseService } from '@/services/courseService';
import CourseTable from '@/components/course/CourseTable';
import CourseForm from '@/components/course/CourseForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AppPagination } from '@/components/ui/app-pagination';

const CoursePage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const page = currentPage - 1;
  const pageSize = 10;
  const totalPages = Math.ceil(courses.length / pageSize);

  const setPage = (newPageOrFn: number | ((p: number) => number)) => {
    const targetZeroBased = typeof newPageOrFn === 'function' ? newPageOrFn(page) : newPageOrFn;
    const targetOneBased = Math.max(1, targetZeroBased + 1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', targetOneBased.toString());
      return next;
    });
  };

  const paginatedCourses = courses.slice(page * pageSize, (page + 1) * pageSize);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await courseService.getAll();
      setCourses(res.data);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải danh sách đối tượng thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreate = () => {
    setSelectedCourse(null);
    setIsFormOpen(true);
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đối tượng thi này?')) {
      try {
        await courseService.delete(id);
        toast.success('Xóa đối tượng thi thành công');
        loadCourses();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi xóa đối tượng thi');
      }
    }
  };

  const handleSubmit = async (data: CourseRequest) => {
    try {
      setIsSubmitting(true);
      if (selectedCourse) {
        await courseService.update(selectedCourse.id, data);
        toast.success('Cập nhật đối tượng thi thành công');
      } else {
        await courseService.create(data);
        toast.success('Thêm đối tượng thi thành công');
      }
      setIsFormOpen(false);
      loadCourses();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Quản lý Đối Tượng Thi</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm mới
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <>
          <CourseTable 
            courses={paginatedCourses} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />

          <AppPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={courses.length}
          />
        </>
      )}

      <CourseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={selectedCourse}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default CoursePage;
