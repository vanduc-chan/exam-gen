import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { toast } from 'sonner';
import { AlertCircle, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';

const formSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tên đợt sinh đề'),
  subjectId: z.string().min(1, 'Vui lòng chọn môn học'),
  courseId: z.string().min(1, 'Vui lòng chọn đối tượng thi'),
  semester: z.string().optional().default('1'),
  academicYear: z.string().min(1, 'Vui lòng chọn năm học'),
  durationMinutes: z.coerce.number().optional().default(90),
  examStructure: z.nativeEnum(ExamStructureType),
  numberOfExams: z.coerce.number().min(1, 'Số lượng đề tối thiểu là 1').max(20, 'Sinh tối đa 20 đề mỗi đợt'),
  numberOfTheories: z.coerce.number().min(0, 'Số câu không được âm'),
  numberOfPractices: z.coerce.number().min(0, 'Số câu không được âm'),
  numberOfEssays: z.coerce.number().min(0, 'Số câu không được âm'),
  numberOfSituations: z.coerce.number().min(0, 'Số câu không được âm'),
}).refine(data => {
  return (data.numberOfTheories + data.numberOfPractices + data.numberOfEssays + data.numberOfSituations) > 0;
}, {
  message: 'Cấu trúc đề thi phải có ít nhất 1 câu hỏi (tổng số câu phải lớn hơn 0)',
  path: ['numberOfTheories'],
});

const ExamGeneratePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get('from');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subjectId: '',
      courseId: '',
      semester: '1',
      academicYear: '2023-2024',
      durationMinutes: 90,
      examStructure: ExamStructureType.THEORY_PRACTICE,
      numberOfExams: 1,
      numberOfTheories: 1,
      numberOfPractices: 1,
      numberOfEssays: 0,
      numberOfSituations: 0,
    },
  });

  const { watch, setValue } = form;
  const numTheories = watch('numberOfTheories') || 0;
  const numPractices = watch('numberOfPractices') || 0;
  const numEssays = watch('numberOfEssays') || 0;
  const numSituations = watch('numberOfSituations') || 0;
  const totalQuestions = numTheories + numPractices + numEssays + numSituations;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subRes, courseRes] = await Promise.all([
          subjectService.getAll(),
          courseService.getAll(),
        ]);
        setSubjects(subRes.data.filter(s => s.isActive !== false));
        setCourses(courseRes.data.filter(c => c.isActive !== false));
      } catch (error) {
        toast.error('Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await examService.generate(data);
      toast.success('Sinh đề thi thành công');
      navigate(fromUrl || '/exams');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || error.message || 'Lỗi khi sinh đề. Có thể không đủ số lượng câu hỏi trong ngân hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 sm:p-8">Đang tải...</div>;

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Tạo Đợt Sinh Đề Mới</h2>
        <p className="text-sm text-muted-foreground mt-1">Cấu hình thông tin kỳ thi và số lượng từng loại câu hỏi để hệ thống tự động sinh đề.</p>
      </div>
      
      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi sinh đề</AlertTitle>
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
                    <Input placeholder="VD: Thi cuối kỳ 1" {...field} />
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
                    <FormControl>
                      <SearchableSelect
                        options={subjects.map(sub => ({
                          value: sub.id,
                          label: `${sub.subjectName} (${sub.subjectCode})`,
                          subLabel: sub.subjectCode
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Chọn môn học..."
                        searchPlaceholder="Tìm kiếm môn học..."
                      />
                    </FormControl>
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
                    <FormControl>
                      <SearchableSelect
                        options={courses.map(c => ({
                          value: c.id,
                          label: `${c.name} (${c.courseCode})`,
                          subLabel: c.courseCode
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Chọn đối tượng thi..."
                        searchPlaceholder="Tìm kiếm đối tượng thi..."
                      />
                    </FormControl>
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
                      <Input placeholder="VD: 2024-2025" {...field} />
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
                    <FormLabel>Số lượng đề cần sinh (1 - 20)</FormLabel>
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

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(fromUrl || '/exams')}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting || totalQuestions === 0}>
                {isSubmitting ? 'Đang xử lý...' : 'Sinh đề thi'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ExamGeneratePage;
