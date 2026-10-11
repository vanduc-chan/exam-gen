import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Question } from '@/types/question';
import { Subject } from '@/types/subject';
import { questionService } from '@/services/questionService';
import { subjectService } from '@/services/subjectService';
import { courseService } from '@/services/courseService';
import { Course } from '@/types/course';
import api from '@/lib/api';
import QuestionTable from '@/components/question/QuestionTable';
import QuestionFilter from '@/components/question/QuestionFilter';
import QuestionImportModal from '@/components/question/QuestionImportModal';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const QuestionListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
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
      const res = await questionService.getQuestions({
        page,
        size,
        ...filters
      });
      setQuestions(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải danh sách câu hỏi');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const loadSubjects = async () => {
    try {
      const res = await subjectService.getAll();
      setSubjects(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await courseService.getAll();
      setCourses(res.data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  useEffect(() => {
    loadSubjects();
    loadCourses();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(questions.map(q => q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      try {
        await questionService.deleteMultiple([id]);
        toast.success('Xóa câu hỏi thành công');
        setSelectedIds(prev => prev.filter(item => item !== id));
        loadData();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi xóa câu hỏi');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} câu hỏi đã chọn?`)) {
      try {
        await questionService.deleteMultiple(selectedIds);
        toast.success('Xóa các câu hỏi thành công');
        setSelectedIds([]);
        loadData();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi xóa câu hỏi');
      }
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Ngân hàng Câu hỏi</h2>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected}>
              <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Nhập Excel
          </Button>
          <Button onClick={() => navigate(`/questions/create?from=${encodeURIComponent(location.pathname + location.search)}`)}>
            <Plus className="mr-2 h-4 w-4" /> Thêm câu hỏi
          </Button>
        </div>
      </div>

      <QuestionFilter 
        subjects={subjects} 
        courses={courses}
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <>
          <QuestionTable 
            questions={questions}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onEdit={(id) => navigate(`/questions/edit/${id}?from=${encodeURIComponent(location.pathname + location.search)}`)}
            onDelete={handleDelete}
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

      <QuestionImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        subjects={subjects}
        courses={courses}
        onSuccess={() => {
          setPage(0);
          loadData();
        }}
      />
    </div>
  );
};

export default QuestionListPage;
