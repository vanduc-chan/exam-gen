import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<any>({});
  
  const initialPage = parseInt(searchParams.get('page') || '0', 10);
  const [page, setPageState] = useState(initialPage);
  
  const setPage = (newPageOrFn: number | ((p: number) => number)) => {
    const newPage = typeof newPageOrFn === 'function' ? newPageOrFn(page) : newPageOrFn;
    setPageState(newPage);
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    }, { replace: true });
  };
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
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Ngân hàng Câu hỏi</h2>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected}>
              <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Nhập Excel
          </Button>
          <Button onClick={() => navigate('/questions/create')}>
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
            onEdit={(id) => navigate(`/questions/edit/${id}`)}
            onDelete={handleDelete}
          />

          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => (
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
