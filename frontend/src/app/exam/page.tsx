import React, { useEffect, useState, useCallback } from 'react';
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
import { Plus, FileText, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ExamPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<any>({});

  // 1-based page in URL (?page=1, ?page=2), 0-based for backend API
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const page = currentPage - 1;

  const setPage = useCallback((newPageOrFn: number | ((p: number) => number)) => {
    const targetZeroBased = typeof newPageOrFn === 'function' ? newPageOrFn(page) : newPageOrFn;
    const targetOneBased = Math.max(1, targetZeroBased + 1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', targetOneBased.toString());
      return next;
    });
  }, [page, setSearchParams]);

  const [totalPages, setTotalPages] = useState(0);
  const size = 10;

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

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0);
  };

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
    // Navigate to exam details (Phase 5/6)
    toast.info('Tính năng xem chi tiết sẽ được cập nhật trong Phase 5');
  };

  const handleEdit = (id: string) => {
    navigate(`/exams/edit/${id}?from=${encodeURIComponent(location.pathname + location.search)}`);
  };

  const handleExport = async (id: string, includeAnswers: boolean = false) => {
    const toastId = toast.loading(includeAnswers ? 'Đang tạo file Word (kèm đáp án)...' : 'Đang tạo file Word...');
    try {
      const blob = await examService.exportToWord(id, includeAnswers);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', includeAnswers ? `exams-answers-${id.substring(0,8)}.docx` : `exams-${id.substring(0,8)}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(includeAnswers ? 'Tải xuống đề thi (kèm đáp án) thành công' : 'Tải xuống đề thi thành công', { id: toastId });
      loadData(); // Refresh to get EXPORTED status
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xuất dữ liệu', { id: toastId });
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Quản lý Đợt Sinh Đề</h2>
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
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <>
          <ExamTable 
            exams={exams}
            onDelete={handleDelete}
            onView={handleView}
            onExport={handleExport}
            onEdit={handleEdit}
          />

          {totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Trang {currentPage} / {totalPages}
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
    </div>
  );
};

export default ExamPage;
