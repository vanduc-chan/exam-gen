import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Question, QuestionType } from '@/types/question';
import { Subject } from '@/types/subject';
import { Course } from '@/types/course';
import { questionService } from '@/services/questionService';
import { subjectService } from '@/services/subjectService';
import { courseService } from '@/services/courseService';
import QuestionTable from '@/components/question/QuestionTable';
import QuestionFilter from '@/components/question/QuestionFilter';
import QuestionImportModal from '@/components/question/QuestionImportModal';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { AppPagination } from '@/components/ui/app-pagination';
import { cleanSearchParam } from '@/lib/utils';

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

  // 1-based page in URL (?page=1, ?page=2), 0-based for backend API
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const page = currentPage - 1;

  // Read all filter params from URL
  const searchParam = cleanSearchParam(searchParams.get('search')) || '';
  const subjectIdParam = searchParams.get('subjectId') || undefined;
  const typeParam = (searchParams.get('type') as QuestionType) || undefined;
  const courseIdsParam = searchParams.get('courseIds') || undefined;

  const filters = useMemo(() => {
    const f: any = {};
    if (searchParam) f.search = searchParam;
    if (subjectIdParam) f.subjectId = subjectIdParam;
    if (typeParam) f.type = typeParam;
    if (courseIdsParam) f.courseIds = courseIdsParam;
    return f;
  }, [searchParam, subjectIdParam, typeParam, courseIdsParam]);

  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState<number | undefined>(undefined);
  const size = 10;

  const updateUrlParams = useCallback((newFilters: any, newPage: number = 0) => {
    setSearchParams(prev => {
      const next = new URLSearchParams();
      // Page (1-based)
      next.set('page', (newPage + 1).toString());
      // Filter values
      const cleanSearch = cleanSearchParam(newFilters.search);
      if (cleanSearch) next.set('search', cleanSearch);
      if (newFilters.subjectId) next.set('subjectId', newFilters.subjectId);
      if (newFilters.type) next.set('type', newFilters.type);
      if (newFilters.courseIds) next.set('courseIds', newFilters.courseIds);
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
      const res = await questionService.getQuestions({
        page,
        size,
        ...filters
      });
      setQuestions(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
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
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Ngân hàng Câu hỏi</h2>
        </div>
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
        <div className="text-center py-10 bg-white rounded-md border">Đang tải dữ liệu...</div>
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

          <AppPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalElements}
            size={size}
          />
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
