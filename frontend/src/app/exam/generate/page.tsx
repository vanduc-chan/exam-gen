import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { examService } from '@/services/examService';
import { subjectService } from '@/services/subjectService';
import { courseService } from '@/services/courseService';
import { questionService } from '@/services/questionService';
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
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tên đợt sinh đề'),
  subjectId: z.string().min(1, 'Vui lòng chọn môn học'),
  courseId: z.string().min(1, 'Vui lòng chọn đối tượng thi'),
  semester: z.string().min(1, 'Vui lòng chọn học kỳ'),
  academicYear: z.string().min(1, 'Vui lòng chọn năm học'),
  durationMinutes: z.coerce.number().min(1, 'Thời gian thi phải lớn hơn 0'),
  examStructure: z.nativeEnum(ExamStructureType),
  numberOfExams: z.coerce.number().min(1, 'Số lượng đề tối thiểu là 1').max(20, 'Sinh tối đa 20 đề mỗi đợt'),
});

const ExamGeneratePage = () => {
  const navigate = useNavigate();
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
    },
  });

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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await examService.generate(data);
      toast.success('Sinh đề thi thành công');
      navigate('/exams');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || error.message || 'Lỗi khi sinh đề. Có thể không đủ số lượng câu hỏi trong ngân hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Đang tải...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Tạo Đợt Sinh Đề Mới</h2>
      
      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi sinh đề</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white p-6 rounded-md border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên đợt sinh đề</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Thi cuối kỳ môn CSDL học kỳ 1 2023-2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Môn học</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn môn học..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.subjectName}
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
                    <FormLabel>Đối tượng thi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đối tượng thi..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
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
                    <FormLabel>Học kỳ</FormLabel>
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
                    <FormLabel>Năm học</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: 2023-2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="examStructure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cấu trúc đề thi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn cấu trúc đề thi..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ExamStructureType.THEORY_PRACTICE}>1 Lý thuyết + 1 Thực hành</SelectItem>
                        <SelectItem value={ExamStructureType.ESSAY}>1 Tự luận</SelectItem>
                        <SelectItem value={ExamStructureType.THEORY_PRACTICE_SITUATION}>1 LT + 1 TH + 1 Tình huống</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input type="number" {...field} />
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
                    <FormLabel>Số lượng đề cần sinh</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="20" {...field} />
                    </FormControl>
                    <FormDescription>
                      Hệ thống sẽ chọn ngẫu nhiên không trùng lặp các câu hỏi dựa theo cấu trúc đã chọn.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/exams')}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
