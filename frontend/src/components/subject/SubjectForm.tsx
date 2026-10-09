import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Subject, SubjectRequest } from '@/types/subject';
import { DepartmentGroup } from '@/types/departmentGroup';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  subjectCode: z.string().min(1, 'Mã môn học không được để trống').max(50, 'Tối đa 50 ký tự'),
  subjectName: z.string().min(1, 'Tên môn học không được để trống'),
  description: z.string().optional(),
  departmentGroupId: z.string().optional(),
});

interface SubjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Subject | null;
  departmentGroups: DepartmentGroup[];
  onSubmit: (data: SubjectRequest) => void;
  isSubmitting?: boolean;
}

const SubjectForm: React.FC<SubjectFormProps> = ({
  open,
  onOpenChange,
  initialData,
  departmentGroups,
  onSubmit,
  isSubmitting = false,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectCode: '',
      subjectName: '',
      description: '',
      departmentGroupId: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        subjectCode: initialData.subjectCode,
        subjectName: initialData.subjectName,
        description: initialData.description || '',
        departmentGroupId: initialData.departmentGroupId || '',
      });
    } else {
      form.reset({
        subjectCode: '',
        subjectName: '',
        description: '',
        departmentGroupId: '',
      });
    }
  }, [initialData, form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Cập nhật môn học' : 'Thêm mới môn học'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="departmentGroupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tổ bộ môn trực thuộc</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tổ bộ môn..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departmentGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
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
              name="subjectCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã môn học</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: TOAN1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subjectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên môn học</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Toán đại cương" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Input placeholder="Mô tả ngắn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SubjectForm;
