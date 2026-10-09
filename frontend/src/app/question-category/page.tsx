import React, { useEffect, useState } from 'react';
import { QuestionCategory } from '@/types/questionCategory';
import { questionCategoryService } from '@/services/questionCategoryService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const QuestionCategoryPage = () => {
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await questionCategoryService.getAll();
      setCategories(res.data);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải danh sách phân loại câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Phân Loại Câu Hỏi (Dữ liệu gốc)</h2>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phân loại</TableHead>
                <TableHead>Tên phân loại</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.code}</TableCell>
                  <TableCell>{category.name}</TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default QuestionCategoryPage;
