import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { graduationExamService } from '@/services/graduationExamService';
import { subjectService } from '@/services/subjectService';
import { courseService } from '@/services/courseService';
import {
  BlueprintSection,
  ExamBlueprint,
  SlotSourceType,
} from '@/types/graduationExam';
import { Subject } from '@/types/subject';
import { Course } from '@/types/course';
import { QuestionType } from '@/types/question';
import { GraduationBlueprintBuilder } from '@/components/graduation-exam/GraduationBlueprintBuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertCircle, Award, BookmarkPlus, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

const GraduationExamGeneratePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get('from');
  const initialBlueprintId = searchParams.get('blueprintId');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [blueprints, setBlueprints] = useState<ExamBlueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [title, setTitle] = useState('ĐỀ THI TỐT NGHIỆP');
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [unit, setUnit] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [numberOfExams, setNumberOfExams] = useState<number>(1);
  const [examsPerBatch, setExamsPerBatch] = useState<number>(20);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('');
  const [sections, setSections] = useState<BlueprintSection[]>([]);

  // Save Blueprint Modal state
  const [saveBpOpen, setSaveBpOpen] = useState(false);
  const [bpName, setBpName] = useState('');
  const [bpDescription, setBpDescription] = useState('');
  const [bpCourseIds, setBpCourseIds] = useState<string[]>([]);
  const [isSavingBp, setIsSavingBp] = useState(false);

  // Memoize select options so typing in text fields never recreates arrays
  const courseOptions = useMemo(
    () =>
      courses.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.courseCode})`,
        subLabel: c.courseCode,
      })),
    [courses]
  );

  const blueprintOptions = useMemo(
    () => [
      { value: 'NONE', label: '-- Chọn Khung đề mẫu có sẵn --' },
      ...blueprints.map((b) => ({
        value: b.id,
        label: `${b.name} (${b.totalQuestions} câu)`,
        subLabel: (b.courseNames || []).join(', '),
      })),
    ],
    [blueprints]
  );

  const handleSectionsChange = useCallback((nextSections: BlueprintSection[]) => {
    setSections(nextSections);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [subRes, courseRes, bpRes] = await Promise.all([
          subjectService.getAll(),
          courseService.getAll(),
          graduationExamService.getBlueprints(),
        ]);
        const activeSubjects = (subRes.data || []).filter((s) => s.isActive !== false);
        const activeCourses = (courseRes.data || []).filter((c) => c.isActive !== false);
        const allBps = bpRes.data || [];

        setSubjects(activeSubjects);
        setCourses(activeCourses);
        setBlueprints(allBps);

        if (initialBlueprintId) {
          const found = allBps.find((b) => b.id === initialBlueprintId);
          if (found) {
            setSelectedBlueprintId(found.id);
            if (found.courseIds?.length) setCourseIds(found.courseIds);
            setSections(found.sections || []);
            return;
          }
        }

        // Default initial structure: 2 sections from first 2 subjects (4 questions total)
        const s1 = activeSubjects[0];
        const s2 = activeSubjects[1] || activeSubjects[0];
        const defaultSections: BlueprintSection[] = [];
        if (s1) {
          defaultSections.push({
            id: 'sec-init-1',
            sectionOrder: 1,
            title: `Phần 1: ${s1.subjectName}`,
            subjectId: s1.id,
            subjectName: s1.subjectName,
            slots: [
              {
                id: 'slot-init-1',
                slotOrder: 1,
                sourceType: SlotSourceType.BANK_RANDOM,
                subjectId: s1.id,
                subjectName: s1.subjectName,
                questionType: QuestionType.LY_THUYET,
                questionCount: 1,
                questionIds: [],
              },
              {
                id: 'slot-init-2',
                slotOrder: 2,
                sourceType: SlotSourceType.BANK_RANDOM,
                subjectId: s1.id,
                subjectName: s1.subjectName,
                questionType: QuestionType.THUC_HANH,
                questionCount: 1,
                questionIds: [],
              },
            ],
          });
        }
        if (s2) {
          defaultSections.push({
            id: 'sec-init-2',
            sectionOrder: 2,
            title: `Phần 2: ${s2.subjectName}`,
            subjectId: s2.id,
            subjectName: s2.subjectName,
            slots: [
              {
                id: 'slot-init-3',
                slotOrder: 1,
                sourceType: SlotSourceType.BANK_RANDOM,
                subjectId: s2.id,
                subjectName: s2.subjectName,
                questionType: QuestionType.LY_THUYET,
                questionCount: 1,
                questionIds: [],
              },
              {
                id: 'slot-init-4',
                slotOrder: 2,
                sourceType: SlotSourceType.BANK_RANDOM,
                subjectId: s2.id,
                subjectName: s2.subjectName,
                questionType: QuestionType.THUC_HANH,
                questionCount: 1,
                questionIds: [],
              },
            ],
          });
        }
        setSections(defaultSections);
      } catch (e) {
        toast.error('Lỗi khi tải dữ liệu khởi tạo');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [initialBlueprintId]);

  const handleLoadBlueprint = useCallback(
    (bpId: string) => {
      setSelectedBlueprintId(bpId);
      if (!bpId || bpId === 'NONE') return;
      const found = blueprints.find((b) => b.id === bpId);
      if (found) {
        setSections(JSON.parse(JSON.stringify(found.sections || [])));
        if (found.courseIds && found.courseIds.length > 0 && courseIds.length === 0) {
          setCourseIds(found.courseIds);
        }
        toast.success(`Đã nạp cấu trúc từ khung đề "${found.name}"`);
      }
    },
    [blueprints, courseIds.length]
  );

  const openSaveBlueprintModal = () => {
    setBpName(title ? `Khung đề - ${title}` : 'Khung đề thi tốt nghiệp mẫu');
    setBpDescription('');
    setBpCourseIds(courseIds.length > 0 ? [...courseIds] : []);
    setSaveBpOpen(true);
  };

  const handleSaveBlueprint = async () => {
    if (!bpName.trim()) {
      toast.error('Vui lòng nhập tên khung đề mẫu');
      return;
    }
    if (!bpCourseIds.length) {
      toast.error('Vui lòng chọn ít nhất một đối tượng gắn với khung đề mẫu');
      return;
    }
    try {
      setIsSavingBp(true);
      const res = await graduationExamService.createBlueprint({
        name: bpName.trim(),
        description: bpDescription.trim() || undefined,
        courseIds: bpCourseIds,
        sections,
      });
      setBlueprints((prev) => [res.data, ...prev]);
      setSelectedBlueprintId(res.data.id);
      setSaveBpOpen(false);
      toast.success('Đã lưu Khung đề mẫu thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Lỗi khi lưu khung đề mẫu');
    } finally {
      setIsSavingBp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên kỳ thi tốt nghiệp');
      return;
    }
    if (!courseIds.length) {
      setErrorMsg('Vui lòng chọn ít nhất một đối tượng dự thi');
      return;
    }
    if (!examDate) {
      setErrorMsg('Vui lòng chọn thời gian thi');
      return;
    }
    if (!sections.length) {
      setErrorMsg('Vui lòng thêm ít nhất một Phần thi (Section)');
      return;
    }

    try {
      setIsSubmitting(true);
      await graduationExamService.generate({
        title: title.trim(),
        courseIds,
        unit: unit.trim() || undefined,
        examDate,
        numberOfExams: Math.max(1, numberOfExams),
        examsPerBatch: Math.max(1, examsPerBatch),
        blueprintId:
          selectedBlueprintId && selectedBlueprintId !== 'NONE'
            ? selectedBlueprintId
            : undefined,
        sections,
      });
      toast.success('Sinh đề thi tốt nghiệp thành công!');
      navigate(fromUrl || '/graduation-exams');
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.message ||
          error.message ||
          'Lỗi khi sinh đề thi tốt nghiệp. Vui lòng kiểm tra lại cấu trúc và số lượng câu hỏi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 sm:p-8">Đang tải dữ liệu...</div>;

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Tạo Đề Thi Tốt Nghiệp Mới
          </h2>
        </div>

        {/* Blueprint Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-64">
            <SearchableSelect
              options={blueprintOptions}
              value={selectedBlueprintId || 'NONE'}
              onChange={handleLoadBlueprint}
              placeholder="Nạp từ Khung đề mẫu..."
              searchPlaceholder="Tìm khung đề mẫu..."
            />
          </div>
          <Button type="button" variant="outline" onClick={openSaveBlueprintModal}>
            <BookmarkPlus className="h-4 w-4 mr-1.5 text-primary" />
            Lưu làm Khung đề mẫu
          </Button>
        </div>
      </div>

      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không thể sinh đề thi tốt nghiệp</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Exam Metadata Card */}
        <div className="bg-white p-4 sm:p-6 rounded-md border shadow-sm space-y-5">
          <h3 className="text-base font-semibold border-b pb-2.5">
            1. Thông tin chung của kỳ thi tốt nghiệp
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Tên kỳ thi tốt nghiệp <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: ĐỀ THI TỐT NGHIỆP"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">
                Đối tượng dự thi (1 hoặc nhiều đối tượng) <span className="text-destructive">*</span>
              </label>
              <SearchableMultiSelect
                options={courseOptions}
                values={courseIds}
                onChange={setCourseIds}
                placeholder="Chọn một hoặc nhiều đối tượng thi..."
                searchPlaceholder="Tìm kiếm đối tượng thi..."
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Đơn vị</label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="VD: Đại đội 10 - Tiểu đoàn 4"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ký hiệu xuất đề sẽ tự động chuyển thành định dạng quân sự (VD: c10/d4)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">
                Thời gian thi <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full cursor-pointer justify-between [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch (_) {}
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">
                Số lượng bộ đề <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={1}
                value={numberOfExams}
                onChange={(e) => setNumberOfExams(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Số bộ đề cần tạo (các bộ đề dùng chung ngân hàng, mỗi bộ xuất ra 1 file Word riêng)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">
                Số đề nhỏ trong mỗi bộ <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={1}
                value={examsPerBatch}
                onChange={(e) => setExamsPerBatch(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Số lượng đề thi con trong mỗi bộ đề (VD: 20 đề)
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Blueprint Builder (Memoized so typing in title/unit never re-renders it) */}
        <div className="bg-white p-4 sm:p-6 rounded-md border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <h3 className="text-base font-semibold">
                2. Cấu trúc các Phần thi (Sections) &amp; Ô câu hỏi (Slots)
              </h3>
            </div>
          </div>

          <GraduationBlueprintBuilder
            sections={sections}
            onChange={handleSectionsChange}
            subjects={subjects}
            courseIds={courseIds}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(fromUrl || '/graduation-exams')}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang sinh bộ đề tốt nghiệp...' : 'Sinh đề thi tốt nghiệp'}
          </Button>
        </div>
      </form>

      {/* Dialog: Lưu Khung đề mẫu */}
      <Dialog open={saveBpOpen} onOpenChange={setSaveBpOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Lưu làm Khung đề tốt nghiệp mẫu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium block mb-1">
                Tên khung đề mẫu <span className="text-destructive">*</span>
              </label>
              <Input
                value={bpName}
                onChange={(e) => setBpName(e.target.value)}
                placeholder="VD: Khung đề tốt nghiệp Đào tạo Tiểu đội trưởng (4 câu)"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Gắn với đối tượng dự thi (1 hoặc nhiều đối tượng){' '}
                <span className="text-destructive">*</span>
              </label>
              <SearchableMultiSelect
                options={courseOptions}
                values={bpCourseIds}
                onChange={setBpCourseIds}
                placeholder="Chọn các đối tượng sử dụng khung đề này..."
                searchPlaceholder="Tìm kiếm đối tượng..."
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Mô tả / Ghi chú</label>
              <Input
                value={bpDescription}
                onChange={(e) => setBpDescription(e.target.value)}
                placeholder="VD: Phần 1 Kỹ thuật Công binh (2 câu), Phần 2 Chiến thuật (2 câu)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveBpOpen(false)}>
              Đóng
            </Button>
            <Button type="button" onClick={handleSaveBlueprint} disabled={isSavingBp}>
              {isSavingBp ? 'Đang lưu...' : 'Lưu Khung đề mẫu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GraduationExamGeneratePage;
