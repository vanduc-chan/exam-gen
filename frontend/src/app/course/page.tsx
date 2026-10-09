import React, { useEffect, useState } from 'react';
import { Course, CourseRequest } from '@/types/course';
import { courseService } from '@/services/courseService';
import CourseTable from '@/components/course/CourseTable';
import CourseForm from '@/components/course/CourseForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const CoursePage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Quản lý Đối Tượng Thi</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm mới
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <CourseTable 
          courses={courses} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
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
