import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { QuestionRequest, QuestionType, DifficultyLevel } from '@/types/question';
import { Subject } from '@/types/subject';
import { QuestionCategory } from '@/types/questionCategory';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  code: z.string().optional(),
  content: z.string().min(1, 'Nội dung không được để trống'),
  type: z.nativeEnum(QuestionType),
  difficultyLevel: z.nativeEnum(DifficultyLevel),
  score: z.coerce.number().optional(),
  answer: z.string().optional(),
  mediaUrl: z.string().optional(),
  subjectId: z.string().min(1, 'Vui lòng chọn môn học'),
  categoryId: z.string().min(1, 'Vui lòng chọn phân loại'),
  isActive: z.boolean().default(true),
});

interface QuestionFormProps {
  initialData?: any;
  subjects: Subject[];
  categories: QuestionCategory[];
  onSubmit: (data: QuestionRequest) => void;
  isSubmitting?: boolean;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  initialData,
  subjects,
  categories,
  onSubmit,
  isSubmitting = false,
}) => {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      content: '',
      type: QuestionType.LY_THUYET,
      difficultyLevel: DifficultyLevel.MEDIUM,
      score: 1.0,
      answer: '',
      mediaUrl: '',
      subjectId: '',
      categoryId: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        code: initialData.code || '',
        content: initialData.content,
        type: initialData.type,
        difficultyLevel: initialData.difficultyLevel,
        score: initialData.score || 1.0,
        answer: initialData.answer || '',
        mediaUrl: initialData.mediaUrl || '',
        subjectId: initialData.subjectId,
        categoryId: initialData.categoryId,
        isActive: initialData.isActive,
      });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phân loại cấu trúc (Gốc)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phân loại..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại câu hỏi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại câu hỏi..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={QuestionType.LY_THUYET}>Lý thuyết</SelectItem>
                    <SelectItem value={QuestionType.THUC_HANH}>Thực hành</SelectItem>
                    <SelectItem value={QuestionType.TU_LUAN}>Tự luận</SelectItem>
                    <SelectItem value={QuestionType.TINH_HUONG}>Tình huống</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="difficultyLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Độ khó</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn độ khó..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={DifficultyLevel.EASY}>Dễ</SelectItem>
                    <SelectItem value={DifficultyLevel.MEDIUM}>Trung bình</SelectItem>
                    <SelectItem value={DifficultyLevel.HARD}>Khó</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nội dung câu hỏi</FormLabel>
              <FormControl>
                <Textarea placeholder="Nhập nội dung câu hỏi..." className="min-h-[120px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Đáp án / Hướng dẫn giải</FormLabel>
              <FormControl>
                <Textarea placeholder="Nhập đáp án..." className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Điểm mặc định</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mediaUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Đính kèm Media (Tùy chọn)</FormLabel>
                <FormControl>
                  <Input placeholder="URL hình ảnh/video..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Trạng thái hoạt động
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/questions')}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default QuestionForm;
