import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { examService } from '@/services/examService';
import { subjectService } from '@/services/subjectService';
import { courseService } from '@/services/courseService';
import { ExamStructureType } from '@/types/exam';
import { Subject } from '@/types/subject';
import { Course } from '@/types/course';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AlertCircle, Layers, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tên đợt sinh đề'),
  subjectId: z.string().min(1, 'Vui lòng chọn môn học'),
  courseId: z.string().min(1, 'Vui lòng chọn đối tượng thi'),
  semester: z.string().min(1, 'Vui lòng chọn học kỳ'),
  academicYear: z.string().min(1, 'Vui lòng chọn năm học'),
  durationMinutes: z.coerce.number().min(1, 'Thời gian thi phải lớn hơn 0'),
  examStructure: z.nativeEnum(ExamStructureType),
  numberOfExams: z.coerce.number().min(1, 'Số lượng đề tối thiểu là 1').max(20, 'Tối đa 20 đề mỗi đợt'),
  numberOfTheories: z.coerce.number().min(0, 'Số câu không được âm'),
  numberOfPractices: z.coerce.number().min(0, 'Số câu không được âm'),
  numberOfEssays: z.coerce.number().min(0, 'Số câu không được âm'),
  numberOfSituations: z.coerce.number().min(0, 'Số câu không được âm'),
  regenerateQuestions: z.boolean().default(false),
}).refine(data => {
  return (data.numberOfTheories + data.numberOfPractices + data.numberOfEssays + data.numberOfSituations) > 0;
}, {
  message: 'Cấu trúc đề thi phải có ít nhất 1 câu hỏi (tổng số câu phải lớn hơn 0)',
  path: ['numberOfTheories'],
});

const ExamEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get('from');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [examCode, setExamCode] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subjectId: '',
      courseId: '',
      semester: '1',
      academicYear: '2023-2024',
      durationMinutes: 90,
      examStructure: ExamStructureType.CUSTOM,
      numberOfExams: 1,
      numberOfTheories: 1,
      numberOfPractices: 1,
      numberOfEssays: 0,
      numberOfSituations: 0,
      regenerateQuestions: false,
    },
  });

  const { watch, setValue, reset } = form;
  const numTheories = watch('numberOfTheories') || 0;
  const numPractices = watch('numberOfPractices') || 0;
  const numEssays = watch('numberOfEssays') || 0;
  const numSituations = watch('numberOfSituations') || 0;
  const totalQuestions = numTheories + numPractices + numEssays + numSituations;

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [subRes, courseRes, examRes] = await Promise.all([
          subjectService.getAll(),
          courseService.getAll(),
          examService.getById(id),
        ]);
        setSubjects(subRes.data.filter(s => s.isActive !== false));
        setCourses(courseRes.data.filter(c => c.isActive !== false));

        const exam = examRes.data;
        setExamCode(exam.code || '');

        let structure = exam.examStructure || ExamStructureType.CUSTOM;
        let t = exam.numberOfTheories ?? 0;
        let p = exam.numberOfPractices ?? 0;
        let e = exam.numberOfEssays ?? 0;
        let s = exam.numberOfSituations ?? 0;

        if (t === 0 && p === 0 && e === 0 && s === 0) {
          if (structure === ExamStructureType.THEORY_PRACTICE) {
            t = 1; p = 1;
          } else if (structure === ExamStructureType.ESSAY) {
            e = 1;
          } else if (structure === ExamStructureType.THEORY_PRACTICE_SITUATION) {
            t = 1; p = 1; s = 1;
          }
        }

        reset({
          title: exam.title || '',
          subjectId: exam.subjectId || '',
          courseId: exam.courseId || '',
          semester: exam.semester || '1',
          academicYear: exam.academicYear || '2023-2024',
          durationMinutes: exam.durationMinutes || 90,
          examStructure: structure,
          numberOfExams: exam.numberOfExams || 1,
          numberOfTheories: t,
          numberOfPractices: p,
          numberOfEssays: e,
          numberOfSituations: s,
          regenerateQuestions: false,
        });
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi tải thông tin đợt sinh đề');
        navigate(fromUrl || '/exams');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, reset, navigate]);

  const handleStructurePresetChange = (preset: ExamStructureType) => {
    setValue('examStructure', preset);
    if (preset === ExamStructureType.THEORY_PRACTICE) {
      setValue('numberOfTheories', 1);
      setValue('numberOfPractices', 1);
      setValue('numberOfEssays', 0);
      setValue('numberOfSituations', 0);
    } else if (preset === ExamStructureType.ESSAY) {
      setValue('numberOfTheories', 0);
      setValue('numberOfPractices', 0);
      setValue('numberOfEssays', 1);
      setValue('numberOfSituations', 0);
    } else if (preset === ExamStructureType.THEORY_PRACTICE_SITUATION) {
      setValue('numberOfTheories', 1);
      setValue('numberOfPractices', 1);
      setValue('numberOfEssays', 0);
      setValue('numberOfSituations', 1);
    }
  };

  const handleCountChange = (field: 'numberOfTheories' | 'numberOfPractices' | 'numberOfEssays' | 'numberOfSituations', val: number) => {
    setValue(field, Math.max(0, val));
    setValue('examStructure', ExamStructureType.CUSTOM);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await examService.update(id, data);
      toast.success('Cập nhật đợt sinh đề thành công');
      navigate(fromUrl || '/exams');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || error.message || 'Lỗi khi cập nhật đợt sinh đề.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 sm:p-8">Đang tải thông tin...</div>;

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Chỉnh sửa Đợt Sinh Đề</h2>
          <p className="text-sm text-muted-foreground mt-1">Cập nhật thông tin và tùy chỉnh cấu trúc số lượng câu hỏi trong đề thi.</p>
        </div>
        {examCode && (
          <Badge variant="outline" className="text-sm px-3 py-1 bg-white font-mono self-start sm:self-auto">
            Mã: {examCode}
          </Badge>
        )}
      </div>
      
      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi cập nhật</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white p-4 sm:p-6 rounded-md border shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên đợt sinh đề <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Thi cuối kỳ môn CSDL học kỳ 1 2023-2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Môn học <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn môn học..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.subjectName} ({sub.subjectCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đối tượng thi <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đối tượng thi..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.courseCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Học kỳ <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn học kỳ..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Học kỳ 1</SelectItem>
                        <SelectItem value="2">Học kỳ 2</SelectItem>
                        <SelectItem value="3">Học kỳ 3 (Hè)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="academicYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Năm học <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="VD: 2023-2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian làm bài (Phút)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numberOfExams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số lượng đề thi (1 - 20)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Custom Exam Structure Section */}
            <div className="rounded-lg border bg-slate-50/80 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-base">Cấu trúc đề thi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={totalQuestions > 0 ? "default" : "destructive"} className="text-xs">
                    Tổng cộng: {totalQuestions} câu hỏi / đề
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="examStructure"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Mẫu cấu trúc định sẵn</FormLabel>
                      <Select 
                        onValueChange={(val) => handleStructurePresetChange(val as ExamStructureType)} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn mẫu cấu trúc..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ExamStructureType.CUSTOM}>Tùy chỉnh (Tự chọn số lượng từng loại câu hỏi)</SelectItem>
                          <SelectItem value={ExamStructureType.THEORY_PRACTICE}>1 Lý thuyết + 1 Thực hành</SelectItem>
                          <SelectItem value={ExamStructureType.ESSAY}>1 Tự luận</SelectItem>
                          <SelectItem value={ExamStructureType.THEORY_PRACTICE_SITUATION}>1 LT + 1 TH + 1 Tình huống</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Bạn có thể chọn nhanh mẫu định sẵn hoặc tự điều chỉnh số lượng cụ thể từng phần bên dưới.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfTheories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                        Số câu Lý thuyết
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field} 
                          onChange={(e) => handleCountChange('numberOfTheories', parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfPractices"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        Số câu Thực hành
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field} 
                          onChange={(e) => handleCountChange('numberOfPractices', parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfEssays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                        Số câu Tự luận
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field} 
                          onChange={(e) => handleCountChange('numberOfEssays', parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfSituations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />
                        Số câu Tình huống
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field} 
                          onChange={(e) => handleCountChange('numberOfSituations', parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {totalQuestions === 0 && (
                <p className="text-xs text-destructive font-medium">
                  Vui lòng nhập số câu cho ít nhất 1 loại câu hỏi.
                </p>
              )}
            </div>

            {/* Option to regenerate questions */}
            <FormField
              control={form.control}
              name="regenerateQuestions"
              render={({ field }) => (
                <div className="flex items-start space-x-3 rounded-md border p-4 bg-amber-50/50 border-amber-200">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-semibold text-amber-900 cursor-pointer flex items-center gap-1.5">
                      <RefreshCw className="h-4 w-4" />
                      Sinh lại toàn bộ câu hỏi trong đề thi
                    </FormLabel>
                    <FormDescription className="text-amber-700">
                      Tích chọn mục này nếu bạn muốn hệ thống chọn lại ngẫu nhiên các câu hỏi mới theo cấu trúc số lượng câu vừa chỉnh sửa.
                    </FormDescription>
                  </div>
                </div>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(fromUrl || '/exams')}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting || totalQuestions === 0}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ExamEditPage;
