import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Exam } from '@/types/exam';
import { Subject } from '@/types/subject';
import { Course } from '@/types/course';
import { examService } from '@/services/examService';
import { subjectService } from '@/services/subjectService';
import { courseService } from '@/services/courseService';
import ExamTable from '@/components/exam/ExamTable';
import ExamFilter from '@/components/exam/ExamFilter';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AppPagination } from '@/components/ui/app-pagination';

const ExamPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();

  // 1-based page in URL (?page=1, ?page=2), 0-based for backend API
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const page = currentPage - 1;

  // Read all filter params from URL
  const searchParam = searchParams.get('search') || '';
  const subjectIdParam = searchParams.get('subjectId') || undefined;
  const courseIdParam = searchParams.get('courseId') || undefined;

  const filters = useMemo(() => {
    const f: any = {};
    if (searchParam) f.search = searchParam;
    if (subjectIdParam) f.subjectId = subjectIdParam;
    if (courseIdParam) f.courseId = courseIdParam;
    return f;
  }, [searchParam, subjectIdParam, courseIdParam]);

  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState<number | undefined>(undefined);
  const size = 10;

  const updateUrlParams = useCallback((newFilters: any, newPage: number = 0) => {
    setSearchParams(prev => {
      const next = new URLSearchParams();
      // Page (1-based)
      next.set('page', (newPage + 1).toString());
      // Filter values
      if (newFilters.search) next.set('search', newFilters.search);
      if (newFilters.subjectId) next.set('subjectId', newFilters.subjectId);
      if (newFilters.courseId) next.set('courseId', newFilters.courseId);
      return next;
    });
  }, [setSearchParams]);

  const setPage = useCallback((newPageOrFn: number | ((p: number) => number)) => {
    const targetZeroBased = typeof newPageOrFn === 'function' ? newPageOrFn(page) : newPageOrFn;
    updateUrlParams(filters, targetZeroBased);
  }, [page, filters, updateUrlParams]);

  const handleFilterChange = (newFilters: any) => {
    updateUrlParams(newFilters, 0); // Reset to first page on filter change
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await examService.getExams({
        page,
        size,
        ...filters
      });
      setExams(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải danh sách đợt sinh đề');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const loadDependencies = async () => {
    try {
      const [subRes, courseRes] = await Promise.all([
        subjectService.getAll(),
        courseService.getAll(),
      ]);
      setSubjects(subRes.data);
      setCourses(courseRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đợt sinh đề này? Tất cả các đề thi liên quan sẽ bị xóa.')) {
      try {
        await examService.delete(id);
        toast.success('Xóa thành công');
        loadData();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi xóa đợt sinh đề');
      }
    }
  };

  const handleView = (id: string) => {
    toast.info('Tính năng xem chi tiết sẽ được cập nhật trong Phase 5');
  };

  const handleEdit = (id: string) => {
    navigate(`/exams/edit/${id}?from=${encodeURIComponent(location.pathname + location.search)}`);
  };

  const handleExport = async (id: string, includeAnswers: boolean = false) => {
    const toastId = toast.loading(includeAnswers ? 'Đang tạo tệp nén (ZIP) đáp án...' : 'Đang tạo tệp nén (ZIP) đề thi...');
    try {
      const blob = includeAnswers 
        ? await examService.exportAnswersZip(id) 
        : await examService.exportQuestionsZip(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const code = exams.find(e => e.id === id)?.code || id.substring(0, 8);
      link.setAttribute('download', `${code}_${includeAnswers ? 'answers' : 'questions'}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(includeAnswers ? 'Tải xuống tệp ZIP đáp án thành công' : 'Tải xuống tệp ZIP đề thi thành công', { id: toastId });
      loadData(); // Refresh to get EXPORTED status
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xuất dữ liệu', { id: toastId });
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Quản lý Đợt Sinh Đề</h2>
          
        </div>
        <Button onClick={() => navigate(`/exams/generate?from=${encodeURIComponent(location.pathname + location.search)}`)}>
          <Plus className="mr-2 h-4 w-4" /> Tạo đợt sinh đề
        </Button>
      </div>

      <ExamFilter 
        subjects={subjects} 
        courses={courses}
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      {loading ? (
        <div className="text-center py-10 bg-white rounded-md border">Đang tải dữ liệu...</div>
      ) : (
        <>
          <ExamTable 
            exams={exams}
            onDelete={handleDelete}
            onView={handleView}
            onExport={handleExport}
            onEdit={handleEdit}
          />

          <AppPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalElements}
            size={size}
          />
        </>
      )}
    </div>
  );
};

export default ExamPage;
