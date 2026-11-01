import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Exam } from '@/types/exam';
import {
  BlueprintSection,
  ExamBlueprint,
  SlotSourceType,
} from '@/types/graduationExam';
import { Course } from '@/types/course';
import { Subject } from '@/types/subject';
import { QuestionType } from '@/types/question';
import { graduationExamService } from '@/services/graduationExamService';
import { examService } from '@/services/examService';
import { courseService } from '@/services/courseService';
import { subjectService } from '@/services/subjectService';
import { GraduationBlueprintBuilder } from '@/components/graduation-exam/GraduationBlueprintBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select';
import { AppPagination } from '@/components/ui/app-pagination';
import { cleanSearchParam, normalizeSearchQuery } from '@/lib/utils';
import {
  Plus,
  Download,
  FileText,
  FileCheck,
  Pencil,
  Trash2,
  Award,
  Layers,
  Search,
  RotateCcw,
  Sparkles,
  Eye,
  Shuffle,
  CheckSquare,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="secondary">Bản nháp</Badge>;
    case 'GENERATED':
      return <Badge variant="default" className="bg-blue-500">Đã sinh đề</Badge>;
    case 'EXPORTED':
      return <Badge variant="default" className="bg-green-500">Đã xuất file</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const formatQuestionTypeLabel = (qt?: QuestionType | null) => {
  if (!qt) return 'Tất cả loại câu';
  switch (qt) {
    case QuestionType.LY_THUYET:
      return 'Lý thuyết';
    case QuestionType.THUC_HANH:
      return 'Thực hành';
    case QuestionType.TU_LUAN:
      return 'Tự luận';
    case QuestionType.TINH_HUONG:
      return 'Tình huống';
    default:
      return qt;
  }
};

const formatSourceTypeBadge = (sourceType: SlotSourceType) => {
  switch (sourceType) {
    case SlotSourceType.BANK_FIXED:
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[11px]">
          <Lock className="h-3 w-3 mr-1 inline" /> Cố định câu hỏi (BANK_FIXED)
        </Badge>
      );
    case SlotSourceType.BANK_PICKED:
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px]"
        >
          <CheckSquare className="h-3 w-3 mr-1 inline" /> Chọn nhóm câu hỏi (BANK_PICKED)
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[11px]">
          <Shuffle className="h-3 w-3 mr-1 inline" /> Ngẫu nhiên từ ngân hàng (BANK_RANDOM)
        </Badge>
      );
  }
};

const GraduationExamPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'exams' | 'blueprints'>('exams');
  const [exams, setExams] = useState<Exam[]>([]);
  const [blueprints, setBlueprints] = useState<ExamBlueprint[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const page = currentPage - 1;
  const size = 10;

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const courseIdParam = searchParams.get('courseId') || '';

  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState<number | undefined>(undefined);

  // View Blueprint Structure Modal state
  const [viewBlueprint, setViewBlueprint] = useState<ExamBlueprint | null>(null);

  // Edit / Create Blueprint Structure Modal state
  const [editBpOpen, setEditBpOpen] = useState(false);
  const [editingBpId, setEditingBpId] = useState<string | null>(null);
  const [bpName, setBpName] = useState('');
  const [bpDescription, setBpDescription] = useState('');
  const [bpCourseIds, setBpCourseIds] = useState<string[]>([]);
  const [bpSections, setBpSections] = useState<BlueprintSection[]>([]);
  const [isSavingBp, setIsSavingBp] = useState(false);

  const courseFilterOptions = useMemo(
    () => [
      { value: 'ALL', label: 'Tất cả đối tượng dự thi' },
      ...courses.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.courseCode})`,
        subLabel: c.courseCode,
      })),
    ],
    [courses]
  );

  const courseMultiOptions = useMemo(
    () =>
      courses.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.courseCode})`,
        subLabel: c.courseCode,
      })),
    [courses]
  );

  const loadDependencies = async () => {
    try {
      const [courseRes, subRes] = await Promise.all([
        courseService.getAll(),
        subjectService.getAll(),
      ]);
      setCourses((courseRes.data || []).filter((c) => c.isActive !== false));
      setSubjects((subRes.data || []).filter((s) => s.isActive !== false));
    } catch (e) {
      console.error(e);
    }
  };

  const loadExams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await graduationExamService.getGraduationExams({
        page,
        size,
        courseId: courseIdParam || undefined,
        search: cleanSearchParam(searchParams.get('search')),
      });
      setExams(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải danh sách đề thi tốt nghiệp');
    } finally {
      setLoading(false);
    }
  }, [page, courseIdParam, searchParams]);

  const loadBlueprints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await graduationExamService.getBlueprints(courseIdParam || undefined);
      setBlueprints(res.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải danh sách khung đề mẫu');
    } finally {
      setLoading(false);
    }
  }, [courseIdParam]);

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    if (activeTab === 'exams') {
      loadExams();
    } else {
      loadBlueprints();
    }
  }, [activeTab, loadExams, loadBlueprints]);

  const updateUrl = (newSearch: string, newCourseId: string, newPage: number = 0) => {
    const next = new URLSearchParams();
    next.set('page', (newPage + 1).toString());
    const cleanSearch = cleanSearchParam(newSearch);
    if (cleanSearch) next.set('search', cleanSearch);
    if (newCourseId) next.set('courseId', newCourseId);
    setSearchParams(next);
  };

  const handleExport = async (id: string, includeAnswers: boolean = false) => {
    const toastId = toast.loading(
      includeAnswers
        ? 'Đang tạo tệp nén (ZIP) đáp án tốt nghiệp...'
        : 'Đang tạo tệp nén (ZIP) đề thi tốt nghiệp...'
    );
    try {
      const blob = includeAnswers
        ? await examService.exportAnswersZip(id)
        : await examService.exportQuestionsZip(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const code = exams.find((e) => e.id === id)?.code || id.substring(0, 8);
      link.setAttribute('download', `${code}_${includeAnswers ? 'answers' : 'questions'}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(
        includeAnswers
          ? 'Tải xuống tệp ZIP đáp án tốt nghiệp thành công'
          : 'Tải xuống tệp ZIP đề thi tốt nghiệp thành công',
        { id: toastId }
      );
      loadExams();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xuất file Word/ZIP', { id: toastId });
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đợt sinh đề tốt nghiệp này?')) {
      try {
        await graduationExamService.delete(id);
        toast.success('Đã xóa đợt sinh đề tốt nghiệp');
        loadExams();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi xóa đợt sinh đề tốt nghiệp');
      }
    }
  };

  const handleDeleteBlueprint = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khung đề mẫu này?')) {
      try {
        await graduationExamService.deleteBlueprint(id);
        toast.success('Đã xóa khung đề mẫu');
        loadBlueprints();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi xóa khung đề mẫu');
      }
    }
  };

  // Open Create New Blueprint Modal
  const handleOpenCreateBlueprint = () => {
    const s1 = subjects[0];
    setEditingBpId(null);
    setBpName('');
    setBpDescription('');
    setBpCourseIds(courseIdParam ? [courseIdParam] : []);
    setBpSections(
      s1
        ? [
            {
              id: `sec-${Date.now()}`,
              sectionOrder: 1,
              title: `Phần 1: ${s1.subjectName}`,
              subjectId: s1.id,
              subjectName: s1.subjectName,
              slots: [
                {
                  id: `slot-${Date.now()}-1`,
                  slotOrder: 1,
                  sourceType: SlotSourceType.BANK_RANDOM,
                  subjectId: s1.id,
                  subjectName: s1.subjectName,
                  questionType: QuestionType.LY_THUYET,
                  questionCount: 1,
                  questionIds: [],
                },
                {
                  id: `slot-${Date.now()}-2`,
                  slotOrder: 2,
                  sourceType: SlotSourceType.BANK_RANDOM,
                  subjectId: s1.id,
                  subjectName: s1.subjectName,
                  questionType: QuestionType.THUC_HANH,
                  questionCount: 1,
                  questionIds: [],
                },
              ],
            },
          ]
        : []
    );
    setEditBpOpen(true);
  };

  // Open Edit Blueprint Structure Modal
  const handleOpenEditBlueprint = (bp: ExamBlueprint) => {
    setEditingBpId(bp.id);
    setBpName(bp.name || '');
    setBpDescription(bp.description || '');
    setBpCourseIds([...(bp.courseIds || [])]);
    setBpSections(JSON.parse(JSON.stringify(bp.sections || [])));
    setEditBpOpen(true);
  };

  const handleSaveBlueprintModal = async () => {
    if (!bpName.trim()) {
      toast.error('Vui lòng nhập tên khung đề mẫu');
      return;
    }
    if (!bpCourseIds.length) {
      toast.error('Vui lòng chọn ít nhất một đối tượng áp dụng cho khung đề mẫu');
      return;
    }
    if (!bpSections.length) {
      toast.error('Khung đề mẫu phải có ít nhất một phần thi (Section)');
      return;
    }

    try {
      setIsSavingBp(true);
      if (editingBpId) {
        await graduationExamService.updateBlueprint(editingBpId, {
          name: bpName.trim(),
          description: bpDescription.trim() || undefined,
          courseIds: bpCourseIds,
          sections: bpSections,
        });
        toast.success('Đã cập nhật cấu trúc Khung đề mẫu thành công!');
      } else {
        await graduationExamService.createBlueprint({
          name: bpName.trim(),
          description: bpDescription.trim() || undefined,
          courseIds: bpCourseIds,
          sections: bpSections,
        });
        toast.success('Đã tạo Khung đề mẫu mới thành công!');
      }
      setEditBpOpen(false);
      loadBlueprints();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.message || 'Lỗi khi lưu khung đề mẫu'
      );
    } finally {
      setIsSavingBp(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Quản lý Thi Tốt Nghiệp (Đa môn / Tổng hợp)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'blueprints' && (
            <Button variant="outline" onClick={handleOpenCreateBlueprint}>
              <Plus className="mr-2 h-4 w-4" /> Tạo khung đề mẫu mới
            </Button>
          )}
          <Button
            onClick={() =>
              navigate(
                `/graduation-exams/generate?from=${encodeURIComponent(
                  location.pathname + location.search
                )}`
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Tạo đề thi tốt nghiệp
          </Button>
        </div>
      </div>

      {/* Tabs: Danh sách đợt thi vs Khung đề mẫu */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          type="button"
          variant={activeTab === 'exams' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('exams')}
        >
          <Award className="h-4 w-4 mr-1.5" />
          Đợt sinh đề tốt nghiệp
        </Button>
        <Button
          type="button"
          variant={activeTab === 'blueprints' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('blueprints')}
        >
          <Layers className="h-4 w-4 mr-1.5" />
          Khung đề mẫu ({blueprints.length || '...'})
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-md border shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {activeTab === 'exams' && (
          <div className="relative flex-1">
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã kỳ thi tốt nghiệp..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onBlur={() => {
                const normalized = normalizeSearchQuery(searchInput);
                if (normalized !== searchInput) setSearchInput(normalized);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const normalized = normalizeSearchQuery(searchInput);
                  if (normalized !== searchInput) setSearchInput(normalized);
                  updateUrl(searchInput, courseIdParam, 0);
                }
              }}
              className="pl-9"
            />
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          </div>
        )}

        <div className="w-full sm:w-72">
          <SearchableSelect
            options={courseFilterOptions}
            value={courseIdParam || 'ALL'}
            onChange={(val) => updateUrl(searchInput, val === 'ALL' ? '' : val, 0)}
            placeholder="Lọc theo đối tượng dự thi..."
            searchPlaceholder="Tìm đối tượng..."
          />
        </div>

        <div className="flex gap-2">
          {activeTab === 'exams' && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const normalized = normalizeSearchQuery(searchInput);
                if (normalized !== searchInput) setSearchInput(normalized);
                updateUrl(searchInput, courseIdParam, 0);
              }}
            >
              Lọc kết quả
            </Button>
          )}
          {/* <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchInput('');
              updateUrl('', '', 0);
            }}
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Đặt lại
          </Button> */}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-10 bg-white rounded-md border">
          Đang tải dữ liệu...
        </div>
      ) : activeTab === 'exams' ? (
        <>
          <div className="rounded-md border bg-white overflow-x-auto shadow-sm">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Mã Đợt</TableHead>
                  <TableHead>Tên kỳ thi tốt nghiệp</TableHead>
                  <TableHead>Các môn học tổng hợp</TableHead>
                  <TableHead>Đối tượng dự thi</TableHead>
                  <TableHead className="text-center">Cấu trúc</TableHead>
                  <TableHead className="text-center">Số bộ đề</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => {
                  const totalQ =
                    (exam.numberOfTheories || 0) +
                    (exam.numberOfPractices || 0) +
                    (exam.numberOfEssays || 0) +
                    (exam.numberOfSituations || 0);
                  return (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium text-xs text-muted-foreground">
                        {exam.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{exam.title}</div>
                        {exam.unit && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 font-normal">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {exam.unit}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {exam.subjectNames && exam.subjectNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {exam.subjectNames.map((sName, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-[11px] font-normal bg-blue-50/70 text-blue-800 border-blue-200"
                              >
                                {sName}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span>{exam.subjectName || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {exam.courseNames && exam.courseNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {exam.courseNames.map((cName, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-[11px] font-normal py-0 px-1.5 bg-slate-100 text-slate-800 border-slate-200"
                              >
                                {cName}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span>{exam.courseName || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        <Badge variant="secondary" className="font-medium">
                          {exam.sections?.length || 1} phần / {totalQ} câu
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {exam.numberOfExams} bộ
                        {exam.examsPerBatch ? (
                          <span className="text-xs text-muted-foreground block font-normal">
                            ({exam.examsPerBatch} đề/bộ)
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{getStatusBadge(exam.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {exam.createdAt ? format(new Date(exam.createdAt), 'dd/MM/yyyy HH:mm') : ''}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(
                              `/graduation-exams/edit/${exam.id}?from=${encodeURIComponent(
                                location.pathname + location.search
                              )}`
                            )
                          }
                          title="Chỉnh sửa đề thi tốt nghiệp"
                        >
                          <Pencil className="h-4 w-4 text-amber-600" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="Tải tệp nén (ZIP)">
                              <Download className="h-4 w-4 text-blue-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleExport(exam.id, false)}
                              className="cursor-pointer"
                            >
                              <FileText className="mr-2 h-4 w-4 text-blue-500" /> Xuất Đề thi (ZIP)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExport(exam.id, true)}
                              className="cursor-pointer"
                            >
                              <FileCheck className="mr-2 h-4 w-4 text-green-600" /> Xuất Đáp án (ZIP)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExam(exam.id)}
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {exams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Chưa có đợt sinh đề tốt nghiệp nào. Hãy bấm &ldquo;Tạo đề thi tốt nghiệp&rdquo; để bắt đầu.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <AppPagination
            page={page}
            totalPages={totalPages}
            totalItems={totalElements}
            size={size}
            onPageChange={(newPage: number) => {
              updateUrl(searchInput, courseIdParam, newPage);
            }}
          />
        </>
      ) : (
        /* Blueprints Table ("Khung đề mẫu") */
        <div className="rounded-md border bg-white overflow-x-auto shadow-sm">
          <Table className="min-w-[850px]">
            <TableHeader>
              <TableRow>
                <TableHead>Tên khung đề mẫu</TableHead>
                <TableHead>Đối tượng áp dụng</TableHead>
                <TableHead>Cấu trúc các phần</TableHead>
                <TableHead className="text-center">Tổng số câu</TableHead>
                <TableHead>Ngày cập nhật</TableHead>
                <TableHead className="text-center">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blueprints.map((bp) => (
                <TableRow key={bp.id}>
                  <TableCell className="font-medium">
                    <div>{bp.name}</div>
                    {bp.description && (
                      <div className="text-xs text-muted-foreground font-normal">
                        {bp.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[240px]">
                      {(bp.courseNames || []).map((cName, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[11px] font-normal">
                          {cName}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      {(bp.sections || []).map((sec, idx) => (
                        <div key={idx} className="text-slate-700">
                          <strong>{sec.title}</strong> ({sec.slots?.length || 0} ô câu hỏi)
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {bp.totalQuestions} câu / đề
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {bp.updatedAt ? format(new Date(bp.updatedAt), 'dd/MM/yyyy HH:mm') : ''}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewBlueprint(bp)}
                      title="Xem chi tiết cấu trúc khung đề"
                    >
                      <Eye className="h-4 w-4 text-blue-600" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditBlueprint(bp)}
                      title="Chỉnh sửa cấu trúc khung đề"
                    >
                      <Pencil className="h-4 w-4 text-amber-600" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs mx-1"
                      onClick={() =>
                        navigate(`/graduation-exams/generate?blueprintId=${bp.id}`)
                      }
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" /> Dùng khung đề
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBlueprint(bp.id)}
                      title="Xóa khung đề mẫu"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {blueprints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chưa có Khung đề mẫu nào được lưu. Hãy bấm &ldquo;Tạo khung đề mẫu mới&rdquo; hoặc lưu từ màn hình Tạo đề thi tốt nghiệp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 1. Dialog: Xem chi tiết cấu trúc Khung đề mẫu */}
      <Dialog open={!!viewBlueprint} onOpenChange={(open) => !open && setViewBlueprint(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Chi tiết Khung đề mẫu: {viewBlueprint?.name}
            </DialogTitle>
          </DialogHeader>

          {viewBlueprint && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-2">
              <div className="bg-slate-50 p-3.5 rounded-md border space-y-2 text-sm">
                {viewBlueprint.description && (
                  <div>
                    <span className="font-medium text-slate-600">Mô tả: </span>
                    <span>{viewBlueprint.description}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-slate-600">Đối tượng áp dụng: </span>
                  {(viewBlueprint.courseNames || []).map((cName, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {cName}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                  <span>
                    Tổng số phần: <strong>{viewBlueprint.sections?.length || 0} phần</strong>
                  </span>
                  <span>
                    Tổng số câu hỏi / đề: <strong>{viewBlueprint.totalQuestions} câu</strong>
                  </span>
                </div>
              </div>

              {/* Render Sections & Slots */}
              <div className="space-y-3">
                {(() => {
                  let qNum = 1;
                  return (viewBlueprint.sections || []).map((sec, sIdx) => (
                    <div key={sec.id || sIdx} className="rounded-md border overflow-hidden">
                      <div className="bg-slate-100 px-3.5 py-2 border-b flex items-center justify-between">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          <Badge variant="default">Phần {sIdx + 1}</Badge>
                          <span>{sec.title}</span>
                        </div>
                        {sec.subjectName && (
                          <span className="text-xs text-muted-foreground">
                            Môn mặc định: {sec.subjectName}
                          </span>
                        )}
                      </div>
                      <div className="divide-y bg-white">
                        {(sec.slots || []).map((slot, slotIdx) => {
                          const count = Math.max(1, Number(slot.questionCount) || 1);
                          const rangeLbl =
                            count === 1 ? `Câu ${qNum}` : `Câu ${qNum} - ${qNum + count - 1}`;
                          qNum += count;
                          return (
                            <div
                              key={slot.id || slotIdx}
                              className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                                >
                                  {rangeLbl}
                                </Badge>
                                {formatSourceTypeBadge(slot.sourceType)}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-slate-700">
                                <span>
                                  Môn: <strong>{slot.subjectName || sec.subjectName || '-'}</strong>
                                </span>
                                {slot.sourceType === SlotSourceType.BANK_RANDOM ? (
                                  <span>
                                    Loại câu:{' '}
                                    <strong>{formatQuestionTypeLabel(slot.questionType)}</strong>
                                  </span>
                                ) : (
                                  <span>
                                    Đã chọn:{' '}
                                    <strong>{slot.questionIds?.length || 0} câu trong kho</strong>
                                  </span>
                                )}
                                <span>
                                  Số lượng: <strong>{count} câu</strong>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setViewBlueprint(null)}>
              Đóng
            </Button>
            {viewBlueprint && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const target = viewBlueprint;
                    setViewBlueprint(null);
                    handleOpenEditBlueprint(target);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1.5" /> Chỉnh sửa cấu trúc
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    navigate(`/graduation-exams/generate?blueprintId=${viewBlueprint.id}`)
                  }
                >
                  <Sparkles className="h-4 w-4 mr-1.5" /> Dùng khung đề này
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Dialog: Tạo mới / Chỉnh sửa cấu trúc Khung đề mẫu */}
      <Dialog open={editBpOpen} onOpenChange={setEditBpOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {editingBpId
                ? 'Chỉnh sửa cấu trúc Khung đề thi tốt nghiệp mẫu'
                : 'Tạo Khung đề thi tốt nghiệp mẫu mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-md border">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Tên khung đề mẫu <span className="text-destructive">*</span>
                </label>
                <Input
                  value={bpName}
                  onChange={(e) => setBpName(e.target.value)}
                  placeholder="VD: Khung đề tốt nghiệp Khẩu đội trưởng"
                  className="bg-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Đối tượng áp dụng (1 hoặc nhiều) <span className="text-destructive">*</span>
                </label>
                <SearchableMultiSelect
                  options={courseMultiOptions}
                  values={bpCourseIds}
                  onChange={setBpCourseIds}
                  placeholder="Chọn đối tượng áp dụng..."
                  searchPlaceholder="Tìm kiếm đối tượng..."
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Mô tả / Ghi chú</label>
                <Input
                  value={bpDescription}
                  onChange={(e) => setBpDescription(e.target.value)}
                  placeholder="VD: Cấu trúc 2 phần, 4 câu hỏi"
                  className="bg-white"
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">
                Thiết kế cấu trúc các Phần thi (Sections) &amp; Ô câu hỏi (Slots)
              </h4>
              <GraduationBlueprintBuilder
                sections={bpSections}
                onChange={setBpSections}
                subjects={subjects}
                courseIds={bpCourseIds}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditBpOpen(false)}
              disabled={isSavingBp}
            >
              Hủy
            </Button>
            <Button type="button" onClick={handleSaveBlueprintModal} disabled={isSavingBp}>
              {isSavingBp
                ? 'Đang lưu...'
                : editingBpId
                ? 'Lưu cập nhật Khung đề mẫu'
                : 'Tạo Khung đề mẫu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GraduationExamPage;
