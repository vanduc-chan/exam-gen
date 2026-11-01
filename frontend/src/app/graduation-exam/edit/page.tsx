import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { graduationExamService } from '@/services/graduationExamService';
import { subjectService } from '@/services/subjectService';
import { courseService } from '@/services/courseService';
import { BlueprintSection, ExamBlueprint } from '@/types/graduationExam';
import { Subject } from '@/types/subject';
import { Course } from '@/types/course';
import { GraduationBlueprintBuilder } from '@/components/graduation-exam/GraduationBlueprintBuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select';
import { AlertCircle, Award } from 'lucide-react';
import { toast } from 'sonner';

const GraduationExamEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get('from');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [blueprints, setBlueprints] = useState<ExamBlueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [title, setTitle] = useState('');
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [unit, setUnit] = useState('');
  const [examDate, setExamDate] = useState('');
  const [numberOfExams, setNumberOfExams] = useState<number>(1);
  const [examsPerBatch, setExamsPerBatch] = useState<number>(20);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('');
  const [sections, setSections] = useState<BlueprintSection[]>([]);
  const [regenerateQuestions, setRegenerateQuestions] = useState<boolean>(false);

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
      { value: 'NONE', label: '-- Đổi theo Khung đề mẫu --' },
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
    const loadData = async () => {
      if (!id) return;
      try {
        const [examRes, subRes, courseRes, bpRes] = await Promise.all([
          graduationExamService.getById(id),
          subjectService.getAll(),
          courseService.getAll(),
          graduationExamService.getBlueprints(),
        ]);

        const exam = examRes.data;
        setSubjects((subRes.data || []).filter((s) => s.isActive !== false));
        setCourses((courseRes.data || []).filter((c) => c.isActive !== false));
        setBlueprints(bpRes.data || []);

        setTitle(exam.title || '');
        setCourseIds(
          exam.courseIds && exam.courseIds.length > 0
            ? exam.courseIds
            : exam.courseId
            ? [exam.courseId]
            : []
        );
        setUnit(exam.unit || '');
        setExamDate(exam.examDate || new Date().toISOString().split('T')[0]);
        setNumberOfExams(exam.numberOfExams || 1);
        setExamsPerBatch(exam.examsPerBatch || 20);
        setSelectedBlueprintId(exam.blueprintId || 'NONE');
        setSections(exam.sections || []);
      } catch (e: any) {
        toast.error(e.message || 'Không thể tải thông tin đề thi tốt nghiệp');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleLoadBlueprint = useCallback(
    (bpId: string) => {
      setSelectedBlueprintId(bpId);
      if (!bpId || bpId === 'NONE') return;
      const found = blueprints.find((b) => b.id === bpId);
      if (found) {
        setSections(JSON.parse(JSON.stringify(found.sections || [])));
        toast.success(`Đã nạp cấu trúc từ khung đề "${found.name}"`);
      }
    },
    [blueprints]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
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
      await graduationExamService.update(id, {
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
        regenerateQuestions,
      });
      toast.success('Cập nhật đề thi tốt nghiệp thành công!');
      navigate(fromUrl || '/graduation-exams');
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.message ||
          error.message ||
          'Lỗi khi cập nhật đề thi tốt nghiệp'
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
            Chỉnh Sửa Đề Thi Tốt Nghiệp
          </h2>
        </div>

        <div className="w-64">
          <SearchableSelect
            options={blueprintOptions}
            value={selectedBlueprintId || 'NONE'}
            onChange={handleLoadBlueprint}
            placeholder="Nạp từ Khung đề mẫu..."
            searchPlaceholder="Tìm khung đề mẫu..."
          />
        </div>
      </div>

      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không thể cập nhật đề thi tốt nghiệp</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
                Đối tượng dự thi <span className="text-destructive">*</span>
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
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              id="regen-grad"
              type="checkbox"
              checked={regenerateQuestions}
              onChange={(e) => setRegenerateQuestions(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="regen-grad" className="text-sm font-medium cursor-pointer">
              Bốc lại toàn bộ câu hỏi mới cho các bộ đề (nếu bạn chỉ sửa tên/đơn vị/ngày thi thì không cần tích)
            </label>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-md border shadow-sm space-y-4">
          <h3 className="text-base font-semibold border-b pb-2.5">
            2. Cấu trúc các Phần thi (Sections) &amp; Ô câu hỏi (Slots)
          </h3>

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
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GraduationExamEditPage;
