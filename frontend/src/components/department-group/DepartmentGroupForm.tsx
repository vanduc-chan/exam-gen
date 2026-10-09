import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DepartmentGroup, DepartmentGroupRequest } from '@/types/departmentGroup';
import { Department } from '@/types/department';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  code: z.string().min(1, 'Mã tổ bộ môn không được để trống').max(50, 'Tối đa 50 ký tự'),
  name: z.string().min(1, 'Tên tổ bộ môn không được để trống'),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Vui lòng chọn Khoa'),
  isActive: z.boolean().default(true),
});

interface DepartmentGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: DepartmentGroup | null;
  departments: Department[];
  onSubmit: (data: DepartmentGroupRequest) => void;
  isSubmitting?: boolean;
}

const DepartmentGroupForm: React.FC<DepartmentGroupFormProps> = ({
  open,
  onOpenChange,
  initialData,
  departments,
  onSubmit,
  isSubmitting = false,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      departmentId: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        code: initialData.code,
        name: initialData.name,
        description: initialData.description || '',
        departmentId: initialData.departmentId,
        isActive: initialData.isActive,
      });
    } else {
      form.reset({
        code: '',
        name: '',
        description: '',
        departmentId: '',
        isActive: true,
      });
    }
  }, [initialData, form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Cập nhật tổ bộ môn' : 'Thêm mới tổ bộ môn'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Khoa trực thuộc</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khoa..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
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
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã tổ bộ môn</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: BM01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên tổ bộ môn</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Toán tin" {...field} />
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

export default DepartmentGroupForm;
